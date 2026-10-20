import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Dumbbell,
  Search,
  ChevronRight,
  LogOut,
  Trash2,
  X,
  Sparkles,
  Database,
  ArrowLeft,
  UserPlus,
  Share2,
  Copy,
  Check,
  Ban,
  UserCheck,
  AlertCircle,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type {
  UserProfile,
  WorkoutPlan,
  ExerciseTemplate,
  WorkoutLog,
  WeightEntry,
  UserStatus,
} from '../types';
import { isUserAdmin } from '../types';
import {
  getStudentsForInstructor,
  inviteStudent,
  setStudentActiveStatus,
  logoutUser,
} from '../lib/auth';
import {
  getPlansForStudent,
  savePlanForStudent,
  deletePlanForStudent,
  getLogsForStudent,
  getWeightsForStudent,
  uploadPlanToCloud,
  deletePlanFromCloud,
} from '../lib/storage';

interface ProfessorScreenProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
  onSimulateStudent: (student: UserProfile) => void;
}

export const ProfessorScreen: React.FC<ProfessorScreenProps> = ({
  currentUser,
  onLogout,
  onOpenSettings,
  onSimulateStudent,
}) => {
  const isMaster = isUserAdmin(currentUser);

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  // Dados do aluno selecionado
  const [studentPlans, setStudentPlans] = useState<WorkoutPlan[]>([]);
  const [studentLogs, setStudentLogs] = useState<WorkoutLog[]>([]);
  const [studentWeights, setStudentWeights] = useState<WeightEntry[]>([]);

  // Modais
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showNewExerciseModal, setShowNewExerciseModal] = useState<string | null>(null);

  // Formulário de Convite de Aluno
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    student: UserProfile;
    emailSent: boolean;
    whatsappUrl: string;
    shareLink: string;
    error?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status de ativação/desativação
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Formulários de Treino e Exercício
  const [newPlanCategory, setNewPlanCategory] = useState('Treino A');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState<any>('Peito');
  const [exSets, setExSets] = useState(4);
  const [exReps, setExReps] = useState('8-12');
  const [exRest, setExRest] = useState(75);
  const [exWeight, setExWeight] = useState(20);

  const loadStudents = async () => {
    const list = await getStudentsForInstructor(currentUser.id, isMaster);
    setStudents(list);
    // Se há um aluno em foco, atualiza seus dados
    if (selectedStudent) {
      const updated = list.find((s) => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [currentUser]);

  const selectStudent = (student: UserProfile) => {
    setSelectedStudent(student);
    refreshStudentData(student.id);
  };

  const refreshStudentData = (studentId: string) => {
    setStudentPlans(getPlansForStudent(studentId));
    setStudentLogs(getLogsForStudent(studentId));
    setStudentWeights(getWeightsForStudent(studentId));
  };

  // Envia convite de acesso para o aluno
  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await inviteStudent(
        currentUser,
        inviteName.trim(),
        inviteEmail.trim(),
        invitePhone.trim()
      );

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const cleanPhone = invitePhone.replace(/\D/g, '');
      const greetingMsg = encodeURIComponent(
        `Olá ${inviteName.trim()}! Seu personal ${currentUser.name} convidou você para o FitTrack PRO. Acesse o aplicativo e crie sua senha de primeiro acesso no link: ${origin}`
      );
      const whatsappUrl = cleanPhone
        ? `https://wa.me/55${cleanPhone}?text=${greetingMsg}`
        : `https://wa.me/?text=${greetingMsg}`;

      setInviteResult({
        student: res.student,
        emailSent: res.emailSent,
        whatsappUrl,
        shareLink: origin,
        error: res.error,
      });

      await loadStudents();
    } catch (err: any) {
      alert('Erro ao convidar aluno: ' + (err?.message || 'Tente novamente'));
    } finally {
      setIsInviting(false);
    }
  };

  // Ativa ou desativa a conta do aluno selecionado
  const handleToggleStudentStatus = async () => {
    if (!selectedStudent || isUpdatingStatus) return;
    const currentStatus = selectedStudent.status || 'ativo';
    const newStatus: UserStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

    const confirmMsg =
      newStatus === 'inativo'
        ? `Deseja realmente desativar o aluno ${selectedStudent.name}? Ele ficará impedido de fazer login no aplicativo até ser reativado.`
        : `Deseja reativar o acesso de ${selectedStudent.name}? O aluno voltará a conseguir acessar seus treinos normalmente.`;

    if (!confirm(confirmMsg)) return;

    setIsUpdatingStatus(true);
    try {
      await setStudentActiveStatus(selectedStudent.id, newStatus);
      const updated = { ...selectedStudent, status: newStatus };
      setSelectedStudent(updated);
      await loadStudents();
    } catch (err: any) {
      alert('Erro ao alterar status do aluno: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newPlanName.trim()) return;

    const newPlan: WorkoutPlan = {
      id: `plan-${Date.now()}`,
      studentId: selectedStudent.id,
      createdBy: currentUser.id,
      category: newPlanCategory.trim() || 'Treino',
      name: newPlanName.trim(),
      description: newPlanDesc.trim(),
      exercises: [],
    };

    savePlanForStudent(newPlan);
    await uploadPlanToCloud(newPlan);
    refreshStudentData(selectedStudent.id);

    setShowNewPlanModal(false);
    setNewPlanName('');
    setNewPlanDesc('');
  };

  const handleDeletePlan = async (planId: string) => {
    if (!selectedStudent) return;
    if (confirm('Deseja excluir esta ficha de treino do aluno?')) {
      deletePlanForStudent(planId);
      await deletePlanFromCloud(planId);
      refreshStudentData(selectedStudent.id);
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !showNewExerciseModal || !exName.trim()) return;

    const newEx: ExerciseTemplate = {
      id: `ex-${Date.now()}`,
      name: exName.trim(),
      muscleGroup: exMuscle,
      targetSets: Number(exSets),
      targetReps: exReps,
      restSeconds: Number(exRest),
      lastWeightKg: Number(exWeight),
    };

    const targetPlan = studentPlans.find((p) => p.id === showNewExerciseModal);
    if (targetPlan) {
      targetPlan.exercises.push(newEx);
      savePlanForStudent(targetPlan);
      await uploadPlanToCloud(targetPlan);
      refreshStudentData(selectedStudent.id);
    }

    setShowNewExerciseModal(null);
    setExName('');
  };

  const handleDeleteExercise = async (planId: string, exId: string) => {
    if (!selectedStudent) return;
    const targetPlan = studentPlans.find((p) => p.id === planId);
    if (targetPlan) {
      targetPlan.exercises = targetPlan.exercises.filter((ex) => ex.id !== exId);
      savePlanForStudent(targetPlan);
      await uploadPlanToCloud(targetPlan);
      refreshStudentData(selectedStudent.id);
    }
  };

  const activeCount = students.filter((s) => (s.status || 'ativo') === 'ativo').length;
  const inactiveCount = students.filter((s) => s.status === 'inativo').length;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const status = s.status || 'ativo';

    if (statusFilter === 'ativos') return matchesSearch && status === 'ativo';
    if (statusFilter === 'inativos') return matchesSearch && status === 'inativo';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Top Header do Professor / Admin */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 pt-safe pb-2">
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${
                isMaster
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600 shadow-amber-500/20'
                  : 'bg-purple-600 shadow-purple-600/20'
              }`}
            >
              {isMaster ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white">{currentUser.name}</h1>
                {isMaster ? (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    ADMIN MASTER
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                    PERSONAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                {isMaster ? 'Painel de Administração Global' : 'Painel do Professor'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* O botão do Banco Supabase é exclusivo do Admin Master (igormoraes792@gmail.com) */}
            {isMaster && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-400 hover:text-white transition"
                title="Configurações do Banco Supabase (Exclusivo Master Admin)"
              >
                <Database className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                logoutUser();
                onLogout();
              }}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 space-y-4 pb-20">
        {/* VISÃO 1: GERENCIAR ALUNO ESPECÍFICO */}
        {selectedStudent ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Barra superior de navegação para voltar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar aos Alunos</span>
              </button>

              <button
                onClick={() => onSimulateStudent(selectedStudent)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold hover:bg-indigo-600/30 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simular Visão do Aluno</span>
              </button>
            </div>

            {/* Cartão do Aluno com Status de Ativação */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedStudent.name}</h2>
                      {selectedStudent.status === 'inativo' ? (
                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                          INATIVO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{selectedStudent.email}</p>
                    {selectedStudent.phone && (
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{selectedStudent.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de Desativar ou Reativar Conta */}
              <div className="pt-2 border-t border-zinc-800/80">
                {selectedStudent.status === 'inativo' ? (
                  <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-rose-300">Conta Desativada</p>
                        <p className="text-[10px] text-zinc-400">O aluno não consegue fazer login.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleStudentStatus}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isUpdatingStatus ? 'Reativando...' : 'Reativar'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Acesso do aluno liberado</span>
                    <button
                      onClick={handleToggleStudentStatus}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-rose-900/30 border border-zinc-700/60 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isUpdatingStatus ? 'Atualizando...' : 'Desativar Aluno'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                <div className="bg-zinc-950/60 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Fichas</span>
                  <span className="text-sm font-bold text-white">{studentPlans.length}</span>
                </div>
                <div className="bg-zinc-950/60 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Treinos Feitos</span>
                  <span className="text-sm font-bold text-white">{studentLogs.length}</span>
                </div>
                <div className="bg-zinc-950/60 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Último Peso</span>
                  <span className="text-sm font-bold text-indigo-400">
                    {studentWeights[0] ? `${studentWeights[0].weightKg} kg` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fichas de Treino deste Aluno */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Fichas de Treino do Aluno</h3>
                  <p className="text-[11px] text-zinc-400">Monte e modifique os treinos dele</p>
                </div>
                <button
                  onClick={() => setShowNewPlanModal(true)}
                  className="flex items-center space-x-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Ficha</span>
                </button>
              </div>

              {studentPlans.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-zinc-900 border border-dashed border-zinc-800 text-zinc-400 text-xs">
                  <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="font-semibold text-zinc-300">Nenhum treino montado ainda.</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Clique em "+ Nova Ficha" para criar o Treino A, B, etc.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <div className="p-3.5 flex items-center justify-between border-b border-zinc-800/80">
                        <div>
                          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                            {plan.category}
                          </span>
                          <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                          {plan.description && (
                            <p className="text-[11px] text-zinc-400">{plan.description}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setShowNewExerciseModal(plan.id)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-400 text-xs flex items-center gap-1 font-semibold"
                            title="Adicionar Exercício"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Exercício</span>
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400"
                            title="Excluir ficha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Lista de Exercícios da Ficha */}
                      <div className="p-3 space-y-1.5 bg-zinc-950/40">
                        {plan.exercises.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 text-center py-2">
                            Nenhum exercício ainda. Clique em "+ Exercício".
                          </p>
                        ) : (
                          plan.exercises.map((ex) => (
                            <div
                              key={ex.id}
                              className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between"
                            >
                              <div>
                                <h5 className="text-xs font-bold text-white">{ex.name}</h5>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                                  <span className="text-indigo-400 font-medium">{ex.muscleGroup}</span>
                                  <span>•</span>
                                  <span>{ex.targetSets} séries</span>
                                  <span>•</span>
                                  <span>{ex.targetReps} reps</span>
                                  <span>•</span>
                                  <span>{ex.restSeconds}s descanso</span>
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
                                className="p-1 text-zinc-600 hover:text-red-400 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISÃO 2: LISTAGEM GERAL DE ALUNOS */
          <div className="space-y-4">
            {/* Banner com botão Convidar Aluno */}
            <div className="bg-gradient-to-br from-purple-950/60 to-zinc-900 border border-purple-500/20 rounded-3xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Alunos Cadastrados
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h2 className="text-2xl font-black text-white">{students.length}</h2>
                  <span className="text-xs text-zinc-400">
                    ({activeCount} ativos{inactiveCount > 0 ? `, ${inactiveCount} inativos` : ''})
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Gerencie treinos individuais e evolução</p>
              </div>

              <button
                onClick={() => {
                  setInviteResult(null);
                  setInviteName('');
                  setInviteEmail('');
                  setInvitePhone('');
                  setShowInviteModal(true);
                }}
                className="py-2.5 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 active:scale-95 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Convidar Aluno</span>
              </button>
            </div>

            {/* Filtros de Status (Todos / Ativos / Inativos) */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                  statusFilter === 'todos'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({students.length})
              </button>
              <button
                onClick={() => setStatusFilter('ativos')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                  statusFilter === 'ativos'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ativos ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('inativos')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                  statusFilter === 'inativos'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Inativos ({inactiveCount})
              </button>
            </div>

            {/* Barra de Busca de Alunos */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar aluno por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500"
              />
            </div>

            {/* Lista dos Alunos */}
            <div className="space-y-2.5">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
                  Nenhum aluno encontrado neste filtro.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const plans = getPlansForStudent(student.id);
                  const weights = getWeightsForStudent(student.id);
                  const isInactive = student.status === 'inativo';

                  return (
                    <div
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition active:scale-99 shadow-sm ${
                        isInactive
                          ? 'bg-zinc-900/60 border-zinc-800/60 opacity-75 hover:opacity-100 hover:border-zinc-700'
                          : 'bg-zinc-900 border-zinc-800 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${
                            isInactive
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          }`}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{student.name}</h4>
                            {isInactive ? (
                              <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                                Inativo
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400">{student.email}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                            <span>{plans.length} fichas de treino</span>
                            {weights[0] && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400">{weights[0].weightKg} kg</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-zinc-500">
                        <ChevronRight className="w-5 h-5 text-zinc-600" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CONVIDAR ALUNO (E-MAIL + WHATSAPP) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Convidar Novo Aluno</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteResult ? (
              /* TELA DE SUCESSO DO CONVITE */
              <div className="space-y-4 pt-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">Aluno Convidado com Sucesso!</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {inviteResult.emailSent ? (
                      <>
                        Um e-mail foi enviado para <span className="text-white font-semibold">{inviteResult.student.email}</span>{' '}
                        para que o aluno crie sua primeira senha.
                      </>
                    ) : (
                      <>
                        O perfil de <span className="text-white font-semibold">{inviteResult.student.name}</span> foi criado.{' '}
                        Envie o link abaixo para que ele defina sua senha no primeiro acesso.
                      </>
                    )}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {/* Botão de WhatsApp */}
                  <a
                    href={inviteResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-98"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Enviar Acesso via WhatsApp</span>
                  </a>

                  {/* Botão Copiar Link */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.shareLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do Aplicativo'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    selectStudent(inviteResult.student);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                >
                  Montar Treino do Aluno Agora →
                </button>
              </div>
            ) : (
              /* FORMULÁRIO DE CONVITE */
              <form onSubmit={handleInviteStudent} className="space-y-3 pt-3">
                <p className="text-xs text-zinc-400">
                  Cadastre o aluno e ele receberá um link para definir sua senha no primeiro acesso ao FitTrack PRO.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">E-mail do Aluno</label>
                  <input
                    type="email"
                    placeholder="carlos@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">WhatsApp / Telefone (opcional)</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 text-xs flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isInviting ? 'Enviando Convite...' : 'Enviar Convite e Criar Acesso'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NOVA FICHA PARA O ALUNO */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Nova Ficha para {selectedStudent?.name}</h3>
              <button
                onClick={() => setShowNewPlanModal(false)}
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
                  placeholder="Ex: Treino A, Treino B, Treino C..."
                  value={newPlanCategory}
                  onChange={(e) => setNewPlanCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome / Grupos Musculares</label>
                <input
                  type="text"
                  placeholder="Ex: Peito & Tríceps"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Instruções / Foco (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Foco em cadência e amplitude máxima"
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg text-xs"
              >
                Salvar Ficha do Aluno
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR EXERCÍCIO NA FICHA DO ALUNO */}
      {showNewExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Adicionar Exercício ao Treino</h3>
              <button
                onClick={() => setShowNewExerciseModal(null)}
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
                  placeholder="Ex: Supino Reto com Barra"
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Grupo Muscular</label>
                  <select
                    value={exMuscle}
                    onChange={(e) => setExMuscle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Reps</label>
                  <input
                    type="text"
                    value={exReps}
                    onChange={(e) => setExReps(e.target.value)}
                    placeholder="8-12"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Descanso (s)</label>
                  <input
                    type="number"
                    value={exRest}
                    onChange={(e) => setExRest(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg text-xs"
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
