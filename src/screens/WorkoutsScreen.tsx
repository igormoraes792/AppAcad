import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Play,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
} from 'lucide-react';
import type { WorkoutPlan, ExerciseTemplate } from '../types';
import {
  savePlanForStudent,
  deletePlanForStudent,
  uploadPlanToCloud,
  deletePlanFromCloud,
} from '../lib/storage';

interface WorkoutsScreenProps {
  studentId: string;
  plans: WorkoutPlan[];
  onPlansUpdated: () => void;
  onSelectPlanToStart: (planId: string) => void;
}

export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({
  studentId,
  plans,
  onPlansUpdated,
  onSelectPlanToStart,
}) => {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(plans[0]?.id || null);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<string | null>(null);

  // Form novo treino
  const [newPlanCategory, setNewPlanCategory] = useState('Treino D');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  // Form novo exercicio
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState<any>('Peito');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState('10-12');
  const [exRest, setExRest] = useState(60);
  const [exWeight, setExWeight] = useState(20);

  const toggleExpand = (planId: string) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    const newPlan: WorkoutPlan = {
      id: `plan-${Date.now()}`,
      studentId: studentId,
      category: newPlanCategory.trim() || 'Treino',
      name: newPlanName.trim(),
      description: newPlanDesc.trim(),
      exercises: [],
    };

    savePlanForStudent(newPlan);
    await uploadPlanToCloud(newPlan);

    onPlansUpdated();
    setShowAddPlanModal(false);
    setNewPlanName('');
    setNewPlanDesc('');
    setExpandedPlanId(newPlan.id);
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Tem certeza que deseja excluir esta ficha de treino?')) {
      deletePlanForStudent(planId);
      await deletePlanFromCloud(planId);
      onPlansUpdated();
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddExerciseModal || !exName.trim()) return;

    const newEx: ExerciseTemplate = {
      id: `ex-${Date.now()}`,
      name: exName.trim(),
      muscleGroup: exMuscle,
      targetSets: Number(exSets),
      targetReps: exReps,
      restSeconds: Number(exRest),
      lastWeightKg: Number(exWeight),
    };

    const targetPlan = plans.find((p) => p.id === showAddExerciseModal);
    if (targetPlan) {
      targetPlan.exercises.push(newEx);
      savePlanForStudent(targetPlan);
      await uploadPlanToCloud(targetPlan);
      onPlansUpdated();
    }

    setShowAddExerciseModal(null);
    setExName('');
    setExWeight(20);
  };

  const handleDeleteExercise = async (planId: string, exId: string) => {
    const targetPlan = plans.find((p) => p.id === planId);
    if (targetPlan) {
      targetPlan.exercises = targetPlan.exercises.filter((ex) => ex.id !== exId);
      savePlanForStudent(targetPlan);
      await uploadPlanToCloud(targetPlan);
      onPlansUpdated();
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Top Banner & Botão Criar Treino */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Fichas de Treino</h2>
          <p className="text-xs text-zinc-400">Suas divisões montadas pelo professor</p>
        </div>
        <button
          onClick={() => setShowAddPlanModal(true)}
          className="flex items-center space-x-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ficha</span>
        </button>
      </div>

      {/* Lista de Fichas */}
      <div className="space-y-3">
        {plans.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-zinc-900 border border-dashed border-zinc-800 text-zinc-400 text-xs">
            <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-300">Nenhuma ficha cadastrada ainda.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Peça para seu professor montar seu treino ou clique em "+ Nova Ficha".
            </p>
          </div>
        ) : (
          plans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                {/* Header do Card */}
                <div
                  onClick={() => toggleExpand(plan.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        {plan.category}
                      </span>
                      <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                      <p className="text-[11px] text-zinc-400">
                        {plan.exercises.length} exercícios {plan.description ? `• ${plan.description}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlanToStart(plan.id);
                      }}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-90 transition mr-1"
                      title="Iniciar este treino agora"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                    <button className="text-zinc-500 hover:text-zinc-300 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Conteúdo expandido: Exercícios */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 bg-zinc-950/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-zinc-400">Exercícios Programados</span>
                      <button
                        onClick={() => setShowAddExerciseModal(plan.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Exercício
                      </button>
                    </div>

                    {plan.exercises.length === 0 ? (
                      <div className="p-4 text-center rounded-xl bg-zinc-900 border border-dashed border-zinc-800 text-zinc-500 text-xs">
                        Nenhum exercício cadastrado ainda.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {plan.exercises.map((ex) => (
                          <div
                            key={ex.id}
                            className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between"
                          >
                            <div>
                              <h4 className="text-xs font-bold text-white">{ex.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                                <span className="text-indigo-400 font-medium">{ex.muscleGroup}</span>
                                <span>•</span>
                                <span>{ex.targetSets} séries</span>
                                <span>•</span>
                                <span>{ex.targetReps} reps</span>
                                {ex.lastWeightKg ? (
                                  <>
                                    <span>•</span>
                                    <span className="text-zinc-300 font-semibold">{ex.lastWeightKg} kg</span>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteExercise(plan.id, ex.id)}
                              className="p-1.5 text-zinc-600 hover:text-red-400 transition"
                              title="Remover exercício"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ações inferiores do treino */}
                    <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir esta ficha
                      </button>
                      <button
                        onClick={() => onSelectPlanToStart(plan.id)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-indigo-400" />
                        Começar Treino
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Ficha de Treino */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Nova Ficha de Treino</h3>
              <button
                onClick={() => setShowAddPlanModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Divisão / Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Treino D, Full Body, Superior..."
                  value={newPlanCategory}
                  onChange={(e) => setNewPlanCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome / Músculos Alvo</label>
                <input
                  type="text"
                  placeholder="Ex: Ombros & Trapézio"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição / Foco (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Foco em deltóide lateral e posterior"
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-sm"
              >
                Criar Ficha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Exercício */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Adicionar Exercício</h3>
              <button
                onClick={() => setShowAddExerciseModal(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExercise} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Exercício</label>
                <input
                  type="text"
                  placeholder="Ex: Supino Inclinado com Halteres"
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Grupo Muscular</label>
                  <select
                    value={exMuscle}
                    onChange={(e) => setExMuscle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="Peito">Peito</option>
                    <option value="Costas">Costas</option>
                    <option value="Pernas">Pernas</option>
                    <option value="Ombros">Ombros</option>
                    <option value="Bíceps">Bíceps</option>
                    <option value="Tríceps">Tríceps</option>
                    <option value="Abdômen">Abdômen</option>
                    <option value="Cardio">Cardio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Carga Inicial (kg)</label>
                  <input
                    type="number"
                    value={exWeight}
                    onChange={(e) => setExWeight(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Séries</label>
                  <input
                    type="number"
                    value={exSets}
                    onChange={(e) => setExSets(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Reps Alvo</label>
                  <input
                    type="text"
                    value={exReps}
                    onChange={(e) => setExReps(e.target.value)}
                    placeholder="10-12"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Descanso (s)</label>
                  <input
                    type="number"
                    value={exRest}
                    onChange={(e) => setExRest(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-sm"
              >
                Salvar Exercício
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
