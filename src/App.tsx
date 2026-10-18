import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabType } from './components/BottomNav';
import { SupabaseModal } from './components/SupabaseModal';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import { WeightScreen } from './screens/WeightScreen';
import { EvolutionScreen } from './screens/EvolutionScreen';
import {
  getStoredPlans,
  getStoredLogs,
  getStoredWeights,
  syncPlansWithCloud,
  syncLogsWithCloud,
  syncWeightsWithCloud,
} from './lib/storage';
import type { WorkoutPlan, WorkoutLog, WeightEntry } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('hoje');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePlanToStart, setActivePlanToStart] = useState<string | null>(null);

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  // Carrega dados locais e tenta sincronizar com a nuvem
  const loadData = async () => {
    // Carregamento rápido local imediato
    setPlans(getStoredPlans());
    setLogs(getStoredLogs());
    setWeights(getStoredWeights());

    // Sincronização assíncrona com Supabase se configurado
    try {
      const [cloudPlans, cloudLogs, cloudWeights] = await Promise.all([
        syncPlansWithCloud(),
        syncLogsWithCloud(),
        syncWeightsWithCloud(),
      ]);
      setPlans(cloudPlans);
      setLogs(cloudLogs);
      setWeights(cloudWeights);
    } catch (e) {
      console.warn('Sincronização em nuvem pendente ou offline', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartPlanFromWorkouts = (planId: string) => {
    setActivePlanToStart(planId);
    setCurrentTab('hoje');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Barra de Status e Topo */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Conteúdo Principal com scroll e largura otimizada para iPhone/Mobile */}
      <main className="flex-1 w-full max-w-lg mx-auto overflow-y-auto">
        {currentTab === 'hoje' && (
          <TodayScreen
            plans={plans}
            onWorkoutFinished={loadData}
            activePlanId={activePlanToStart}
            setActivePlanId={setActivePlanToStart}
          />
        )}

        {currentTab === 'treinos' && (
          <WorkoutsScreen
            plans={plans}
            onPlansUpdated={loadData}
            onSelectPlanToStart={handleStartPlanFromWorkouts}
          />
        )}

        {currentTab === 'pesos' && (
          <WeightScreen
            weights={weights}
            onWeightsUpdated={loadData}
          />
        )}

        {currentTab === 'evolucao' && (
          <EvolutionScreen
            logs={logs}
            weights={weights}
          />
        )}
      </main>

      {/* Barra de Abas Inferior estilo iOS */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        isWorkoutActive={false}
      />

      {/* Modal de Configuração do Banco Online Supabase */}
      <SupabaseModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={loadData}
      />
    </div>
  );
}

export default App;
