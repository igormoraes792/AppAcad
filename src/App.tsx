import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabType } from './components/BottomNav';
import { SupabaseModal } from './components/SupabaseModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
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
import { getSupabaseClient, supabaseFetchProfile } from './lib/supabase';
import type { WorkoutPlan, WorkoutLog, WeightEntry, UserProfile } from './types';
import { isUserAdmin } from './types';

const MASTER_ATHLETE_PROFILE: UserProfile = {
  id: 'atleta-igormoraes',
  email: 'igormoraes792@gmail.com',
  name: 'Igor Moraes (Atleta)',
  role: 'aluno',
  status: 'ativo',
  isAdmin: true,
  instructorId: 'admin-igor',
  instructorName: 'Igor Moraes (Master)',
  createdAt: '2026-09-01',
};

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [simulatingStudent, setSimulatingStudent] = useState<UserProfile | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetTargetEmail, setResetTargetEmail] = useState<string | undefined>(undefined);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Modo Atleta para a Conta Master treinar como aluno
  const [isMasterAthleteMode, setIsMasterAthleteMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fittrack_master_athlete_mode') === 'true';
    }
    return false;
  });

  const [currentTab, setCurrentTab] = useState<TabType>('hoje');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePlanToStart, setActivePlanToStart] = useState<string | null>(null);

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  // O aluno em foco (simulação, modo atleta da conta master ou o próprio aluno logado)
  const activeStudent = simulatingStudent || (
    isMasterAthleteMode && isUserAdmin(currentUser)
      ? MASTER_ATHLETE_PROFILE
      : (currentUser?.role === 'aluno' ? currentUser : null)
  );

  // Detecta parâmetros de primeiro acesso ou redefinição na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('firstAccess') === 'true' || params.get('resetPassword') === 'true') {
        setIsResettingPassword(true);
        setResetTargetEmail(params.get('email') || undefined);
      }
    }
  }, []);

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

  // Atualiza perfil na nuvem em segundo plano para manter IDs e status sincronizados
  useEffect(() => {
    if (currentUser?.email) {
      supabaseFetchProfile(currentUser.email).then((cloud) => {
        if (cloud && (cloud.id !== currentUser.id || cloud.status !== currentUser.status)) {
          setCurrentUser(cloud);
          saveSessionUser(cloud);
        }
      });
    }
  }, [currentUser?.email]);

  // Carrega dados do aluno em foco com suporte a e-mail para sincronia imediata
  const loadStudentData = async (student: UserProfile) => {
    // 1. Carregamento rápido local imediato
    setPlans(getPlansForStudent(student.id));
    setLogs(getLogsForStudent(student.id));
    setWeights(getWeightsForStudent(student.id));

    // 2. Sincronização em segundo plano com Supabase
    try {
      const [cloudPlans, cloudLogs, cloudWeights] = await Promise.all([
        syncPlansForStudent(student.id, student.email),
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
  }, [activeStudent?.id, isMasterAthleteMode]);

  // Sincronização automática quando o usuário volta para a aba/tela do app
  useEffect(() => {
    const handleResume = () => {
      if (activeStudent) {
        loadStudentData(activeStudent);
      }
    };
    window.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      window.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [activeStudent?.id]);

  const handleLoginSuccess = (user: UserProfile, mustReset?: boolean) => {
    setCurrentUser(user);
    saveSessionUser(user);
    if (mustReset || user.mustResetPassword) {
      setIsResettingPassword(true);
      setResetTargetEmail(user.email);
      return;
    }
    if (user.role === 'aluno') {
      loadStudentData(user);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setSimulatingStudent(null);
    setIsMasterAthleteMode(false);
    localStorage.removeItem('fittrack_master_athlete_mode');
  };

  // Se o aluno veio de um link de redefinição de senha ou primeiro acesso
  if (isResettingPassword) {
    return (
      <>
        <InstallPromptModal />
        <ResetPasswordScreen
          targetEmail={resetTargetEmail}
          onPasswordResetDone={() => {
            setIsResettingPassword(false);
            if (typeof window !== 'undefined' && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      </>
    );
  }

  // Se nenhum usuário estiver logado, exibe tela de login / cadastro
  if (!currentUser) {
    return (
      <>
        <InstallPromptModal />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // Se for professor ou admin master e NÃO estiver simulando um aluno E NÃO estiver no modo atleta
  if (
    (currentUser.role === 'professor' || currentUser.role === 'admin' || isUserAdmin(currentUser)) &&
    !simulatingStudent &&
    !isMasterAthleteMode
  ) {
    return (
      <>
        <InstallPromptModal />
        <ProfessorScreen
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSimulateStudent={(student) => {
            setSimulatingStudent(student);
            setCurrentTab('hoje');
          }}
          onEnterAthleteMode={() => {
            setIsMasterAthleteMode(true);
            localStorage.setItem('fittrack_master_athlete_mode', 'true');
            setCurrentTab('hoje');
          }}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />

        {/* Modal do Supabase acessível no painel do professor (apenas para Admin Master) */}
        <SupabaseModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onConfigUpdated={() => {
            if (activeStudent) loadStudentData(activeStudent);
          }}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentUser={currentUser}
        />
      </>
    );
  }

  // VISÃO DO ALUNO (OU MODO ATLETA MASTER OU SIMULAÇÃO DO PROFESSOR)
  const targetStudent = activeStudent || currentUser;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      <InstallPromptModal />

      {/* Topo do Aluno com suporte a Modo Atleta e Troca de Senha */}
      <Header
        currentUser={targetStudent}
        onLogout={handleLogout}
        isSimulating={Boolean(simulatingStudent)}
        onExitSimulation={() => setSimulatingStudent(null)}
        isMasterAthlete={isMasterAthleteMode}
        onExitMasterAthlete={() => {
          setIsMasterAthleteMode(false);
          localStorage.removeItem('fittrack_master_athlete_mode');
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
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

      {/* Modal de Alterar Minha Senha */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser || targetStudent}
      />

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
