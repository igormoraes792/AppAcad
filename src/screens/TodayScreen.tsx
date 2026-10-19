import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Plus,
  Trophy,
  Timer as TimerIcon,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { WorkoutPlan, WorkoutLog, CompletedExerciseLog } from '../types';
import { RestTimer } from '../components/RestTimer';
import {
  uploadLogToCloud,
  saveLogForStudent,
  savePlanForStudent,
} from '../lib/storage';

interface TodayScreenProps {
  studentId: string;
  plans: WorkoutPlan[];
  onWorkoutFinished: () => void;
  activePlanId: string | null;
  setActivePlanId: (id: string | null) => void;
}

interface ActiveExerciseState {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  restSeconds: number;
  sets: {
    setNumber: number;
    weightKg: number;
    reps: number;
    completed: boolean;
  }[];
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  studentId,
  plans,
  onWorkoutFinished,
  activePlanId,
  setActivePlanId,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [activeExercises, setActiveExercises] = useState<ActiveExerciseState[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerOpen, setTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [workoutFinishedSummary, setWorkoutFinishedSummary] = useState<WorkoutLog | null>(null);

  // Atualiza seleção se os planos mudarem
  useEffect(() => {
    if (plans.length > 0 && !plans.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans]);

  // Se uma ficha for ativada de outra tela
  useEffect(() => {
    if (activePlanId) {
      const plan = plans.find((p) => p.id === activePlanId);
      if (plan) {
        setSelectedPlanId(activePlanId);
        startWorkoutWithPlan(plan);
        setActivePlanId(null);
      }
    }
  }, [activePlanId, plans]);

  // Cronômetro do treino ativo
  useEffect(() => {
    let interval: any = null;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const startWorkoutWithPlan = (plan: WorkoutPlan) => {
    const initialExercises: ActiveExerciseState[] = plan.exercises.map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      restSeconds: ex.restSeconds || 60,
      sets: Array.from({ length: ex.targetSets || 3 }, (_, i) => ({
        setNumber: i + 1,
        weightKg: ex.lastWeightKg || 20,
        reps: parseInt(ex.targetReps) || 10,
        completed: false,
      })),
    }));

    setActiveExercises(initialExercises);
    setIsWorkoutActive(true);
    setElapsedSeconds(0);
  };

  const handleStartWorkout = () => {
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    if (plan) {
      startWorkoutWithPlan(plan);
    }
  };

  const toggleSetComplete = (exIndex: number, setIndex: number) => {
    setActiveExercises((prev) => {
      const updated = [...prev];
      const targetSet = updated[exIndex].sets[setIndex];
      const wasCompleted = targetSet.completed;
      targetSet.completed = !wasCompleted;

      // Se acabou de completar, aciona vibração e abre timer de descanso
      if (!wasCompleted) {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch (e) {
            // ignore
          }
        }
        setRestSeconds(updated[exIndex].restSeconds || 60);
        setTimerOpen(true);
      }

      return updated;
    });
  };

  const updateSetWeight = (exIndex: number, setIndex: number, weight: number) => {
    setActiveExercises((prev) => {
      const updated = [...prev];
      updated[exIndex].sets[setIndex].weightKg = Math.max(0, weight);
      return updated;
    });
  };

  const updateSetReps = (exIndex: number, setIndex: number, reps: number) => {
    setActiveExercises((prev) => {
      const updated = [...prev];
      updated[exIndex].sets[setIndex].reps = Math.max(0, reps);
      return updated;
    });
  };

  const addSetToExercise = (exIndex: number) => {
    setActiveExercises((prev) => {
      const updated = [...prev];
      const sets = updated[exIndex].sets;
      const lastSet = sets[sets.length - 1];
      sets.push({
        setNumber: sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      });
      return updated;
    });
  };

  const handleFinishWorkout = async () => {
    const plan = plans.find((p) => p.id === selectedPlanId);
    const planName = plan ? `${plan.category} - ${plan.name}` : 'Treino do Dia';

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    const completedExercises: CompletedExerciseLog[] = activeExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets.filter((s) => s.completed),
    }));

    const todayStr = new Date().toISOString().split('T')[0];

    const newLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      studentId: studentId,
      date: todayStr,
      workoutName: planName,
      workoutPlanId: selectedPlanId,
      durationMinutes,
      completedExercises: completedExercises.filter((e) => e.sets.length > 0),
      notes: `Treino finalizado em ${durationMinutes} min.`,
    };

    // Atualiza últimos pesos nas fichas do aluno
    if (plan) {
      const updatedPlan = {
        ...plan,
        exercises: plan.exercises.map((ex) => {
          const finishedEx = activeExercises.find((ae) => ae.exerciseId === ex.id);
          if (finishedEx) {
            const maxWeight = Math.max(...finishedEx.sets.map((s) => s.weightKg), ex.lastWeightKg || 0);
            return { ...ex, lastWeightKg: maxWeight };
          }
          return ex;
        }),
      };
      savePlanForStudent(updatedPlan);
    }

    // Salva o log do treino
    saveLogForStudent(newLog);
    await uploadLogToCloud(newLog);

    // Efeito de confetes no iPhone!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    setWorkoutFinishedSummary(newLog);
    setIsWorkoutActive(false);
    setTimerOpen(false);
    onWorkoutFinished();
  };

  const formatElapsedTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  // Se acabou de finalizar o treino, mostra tela de conquista
  if (workoutFinishedSummary) {
    const totalVolumeKg = workoutFinishedSummary.completedExercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((sAcc, set) => {
          return sAcc + set.weightKg * set.reps;
        }, 0)
      );
    }, 0);

    const totalSetsCompleted = workoutFinishedSummary.completedExercises.reduce(
      (acc, ex) => acc + ex.sets.length,
      0
    );

    return (
      <div className="p-4 space-y-6 pb-28 animate-in zoom-in-95 duration-300">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30 mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-zinc-950" />
          </div>
          <h2 className="text-2xl font-black text-white">Treino Concluído!</h2>
          <p className="text-zinc-400 text-sm mt-1">{workoutFinishedSummary.workoutName}</p>
        </div>

        {/* Estatísticas do Treino */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{workoutFinishedSummary.durationMinutes}</span>
            <span className="text-[10px] block text-zinc-400 uppercase font-semibold">minutos</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{totalSetsCompleted}</span>
            <span className="text-[10px] block text-zinc-400 uppercase font-semibold">séries</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{totalVolumeKg.toLocaleString()}</span>
            <span className="text-[10px] block text-zinc-400 uppercase font-semibold">kg volume</span>
          </div>
        </div>

        <button
          onClick={() => setWorkoutFinishedSummary(null)}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 text-base"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  // TELA EM MODO ATIVO (DURANTE O TREINO)
  if (isWorkoutActive) {
    const currentPlan = plans.find((p) => p.id === selectedPlanId);

    return (
      <div className="p-4 space-y-4 pb-[380px]">
        {/* Barra superior de status do treino ativo */}
        <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-2xl p-4 sticky top-14 z-20 backdrop-blur-lg shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Em Execução
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-[180px]">
              {currentPlan?.category}: {currentPlan?.name}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 font-mono text-base font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{formatElapsedTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Lista de exercícios do treino do dia */}
        <div className="space-y-4">
          {activeExercises.map((ex, exIndex) => (
            <div key={ex.exerciseId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                  <span className="text-[11px] text-zinc-400 font-medium">{ex.muscleGroup}</span>
                </div>
                <button
                  onClick={() => {
                    setRestSeconds(ex.restSeconds || 60);
                    setTimerOpen(true);
                  }}
                  className="flex items-center space-x-1 text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                >
                  <TimerIcon className="w-3.5 h-3.5" />
                  <span>{ex.restSeconds}s</span>
                </button>
              </div>

              {/* Tabela de Séries */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
                  <span className="col-span-2">Série</span>
                  <span className="col-span-4 text-center">Peso (kg)</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-right">Feito</span>
                </div>

                {ex.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`grid grid-cols-12 items-center p-2 rounded-xl transition-colors ${
                      set.completed
                        ? 'bg-emerald-950/30 border border-emerald-500/30'
                        : 'bg-zinc-950 border border-zinc-800/80'
                    }`}
                  >
                    <span className="col-span-2 text-xs font-bold text-zinc-300">
                      #{set.setNumber}
                    </span>

                    {/* Input Peso */}
                    <div className="col-span-4 flex items-center justify-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weightKg}
                        onChange={(e) => updateSetWeight(exIndex, setIndex, Number(e.target.value))}
                        className="w-16 bg-zinc-900 border border-zinc-700/60 rounded-lg py-1 px-1.5 text-center text-sm font-bold text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Input Repetições */}
                    <div className="col-span-4 flex items-center justify-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) => updateSetReps(exIndex, setIndex, Number(e.target.value))}
                        className="w-14 bg-zinc-900 border border-zinc-700/60 rounded-lg py-1 px-1.5 text-center text-sm font-bold text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Botão de Check */}
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => toggleSetComplete(exIndex, setIndex)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                          set.completed
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : 'text-zinc-600 hover:text-zinc-400 bg-zinc-900'
                        }`}
                      >
                        {set.completed ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão adicionar série */}
              <button
                onClick={() => addSetToExercise(exIndex)}
                className="w-full mt-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Série</span>
              </button>
            </div>
          ))}
        </div>

        {/* Botão Finalizar Treino fixo na base */}
        <div className="fixed bottom-16 left-4 right-4 z-20 max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={() => setIsWorkoutActive(false)}
            className="py-3.5 px-4 bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-red-400 font-semibold rounded-2xl text-xs backdrop-blur-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinishWorkout}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-98 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluir Treino</span>
          </button>
        </div>

        {/* Timer de descanso flutuante */}
        <RestTimer
          initialSeconds={restSeconds}
          isOpen={timerOpen}
          onClose={() => setTimerOpen(false)}
        />
      </div>
    );
  }

  // TELA EM MODO INICIAL (ESCOLHER TREINO DO DIA)
  return (
    <div className="p-4 space-y-6 pb-28">
      {/* Card de Boas-vindas / Treino de Hoje */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-900 border border-indigo-500/20 p-5 shadow-xl">
        <div className="relative z-10">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Treino do Dia
          </span>
          <h2 className="text-xl font-black text-white mt-1">Pronto para treinar?</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Selecione sua ficha de hoje e registre cada exercício e carga.
          </p>

          {/* Seletor de Fichas */}
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Escolha o treino:</label>
            {plans.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                Seu professor ainda não cadastrou treinos para você. Fale com seu personal!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {plans.map((p) => {
                  const isSelected = p.id === selectedPlanId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-indigo-400">{p.category}</span>
                        <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                        <p className="text-[11px] text-zinc-400">{p.exercises.length} exercícios</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                          <Play className="w-3 h-3 fill-white ml-0.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão Iniciar Treino */}
          {plans.length > 0 && (
            <button
              onClick={handleStartWorkout}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-98 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 text-base transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Iniciar Treino Agora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
