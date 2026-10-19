import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabType } from './components/BottomNav';
import { SupabaseModal } from './components/SupabaseModal';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import { WeightScreen } from './screens/WeightScreen';
import { EvolutionScreen } from './screens/EvolutionScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ProfessorScreen } from './screens/ProfessorScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import {
  getCurrentUser,
  setCurrentUser as saveSessionUser,
  logoutUser,
} from './lib/auth';
import {
  getPlansForStudent,
  getLogsForStudent,
  getWeightsForStudent,
  syncPlansForStudent,
  syncLogsForStudent,
  syncWeightsForStudent,
} from './lib/storage';
import { getSupabaseClient } from './lib/supabase';
import type { WorkoutPlan, WorkoutLog, WeightEntry, UserProfile } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [simulatingStudent, setSimulatingStudent] = useState<UserProfile | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [currentTab, setCurrentTab] = useState<TabType>('hoje');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePlanToStart, setActivePlanToStart] = useState<string | null>(null);

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  // O aluno em foco (seja o próprio aluno logado ou o aluno sendo simulado pelo personal)
  const activeStudent = simulatingStudent || (currentUser?.role === 'aluno' ? currentUser : null);

  // Monitora evento de recuperação de senha do Supabase
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsResettingPassword(true);
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Carrega dados do aluno em foco
  const loadStudentData = async (student: UserProfile) => {
    // 1. Carregamento rápido local imediato
    setPlans(getPlansForStudent(student.id));
    setLogs(getLogsForStudent(student.id));
    setWeights(getWeightsForStudent(student.id));

    // 2. Sincronização em segundo plano com Supabase se configurado
    try {
      const [cloudPlans, cloudLogs, cloudWeights] = await Promise.all([
        syncPlansForStudent(student.id),
        syncLogsForStudent(student.id),
        syncWeightsForStudent(student.id),
      ]);
      setPlans(cloudPlans);
      setLogs(cloudLogs);
      setWeights(cloudWeights);
    } catch (e) {
      console.warn('Sincronização em nuvem offline ou pendente:', e);
    }
  };

  useEffect(() => {
    if (activeStudent) {
      loadStudentData(activeStudent);
    }
  }, [activeStudent?.id]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    saveSessionUser(user);
    if (user.role === 'aluno') {
      loadStudentData(user);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setSimulatingStudent(null);
  };

  // Se o aluno veio de um link de redefinição de senha enviado por e-mail
  if (isResettingPassword) {
    return (
      <ResetPasswordScreen
        onPasswordResetDone={() => {
          setIsResettingPassword(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

  // Se nenhum usuário estiver logado, exibe tela de login / cadastro
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Se for professor e NÃO estiver simulando um aluno, exibe o painel do professor
  if (currentUser.role === 'professor' && !simulatingStudent) {
    return (
      <>
        <ProfessorScreen
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSimulateStudent={(student) => {
            setSimulatingStudent(student);
            setCurrentTab('hoje');
          }}
        />

        {/* Modal do Supabase acessível no painel do professor */}
        <SupabaseModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onConfigUpdated={() => {
            if (activeStudent) loadStudentData(activeStudent);
          }}
        />
      </>
    );
  }

  // VISÃO DO ALUNO (OU SIMULAÇÃO DO PROFESSOR)
  // O aluno NUNCA vê configurações técnicas de banco. Tudo é 100% automático.
  const targetStudent = activeStudent || currentUser;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Topo do Aluno */}
      <Header
        currentUser={targetStudent}
        onLogout={handleLogout}
        isSimulating={Boolean(simulatingStudent)}
        onExitSimulation={() => setSimulatingStudent(null)}
      />

      {/* Conteúdo Principal com largura e comportamento otimizado para iPhone */}
      <main className="flex-1 w-full max-w-lg mx-auto overflow-y-auto">
        {currentTab === 'hoje' && (
          <TodayScreen
            studentId={targetStudent.id}
            plans={plans}
            onWorkoutFinished={() => loadStudentData(targetStudent)}
            activePlanId={activePlanToStart}
            setActivePlanId={setActivePlanToStart}
          />
        )}

        {currentTab === 'treinos' && (
          <WorkoutsScreen
            studentId={targetStudent.id}
            plans={plans}
            onPlansUpdated={() => loadStudentData(targetStudent)}
            onSelectPlanToStart={(planId) => {
              setActivePlanToStart(planId);
              setCurrentTab('hoje');
            }}
          />
        )}

        {currentTab === 'pesos' && (
          <WeightScreen
            studentId={targetStudent.id}
            weights={weights}
            onWeightsUpdated={() => loadStudentData(targetStudent)}
          />
        )}

        {currentTab === 'evolucao' && (
          <EvolutionScreen
            logs={logs}
            weights={weights}
          />
        )}
      </main>

      {/* Barra de Navegação Inferior estilo iOS */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        isWorkoutActive={false}
      />
    </div>
  );
}

export default App;
