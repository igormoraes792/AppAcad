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
  Phone,
  ShieldCheck,
  CheckCircle2,
  BookmarkPlus,
  Layers,
  FileText,
  KeyRound,
  Pencil,
} from 'lucide-react';
import type {
  UserProfile,
  WorkoutPlan,
  WorkoutPlanTemplate,
  ExerciseTemplate,
  WorkoutLog,
  WeightEntry,
  UserStatus,
} from '../types';
import { isUserAdmin } from '../types';
import {
  getStudentsForInstructor,
  inviteStudent,
  inviteInstructor,
  getInstructorsList,
  resetStudentPasswordByInstructor,
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
  savePlanAsTemplate,
  deletePlanTemplate,
  saveOrUpdatePlanTemplate,
  applyTemplateToStudent,
  syncTemplatesWithCloud,
} from '../lib/storage';
import {
  PRESET_EXERCISES,
  MUSCLE_GROUPS,
  type PresetExercise,
} from '../constants/presetExercises';
import { SystemLogsModal } from '../components/SystemLogsModal';
import { addSystemLog } from '../lib/logger';

interface ProfessorScreenProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
  onSimulateStudent: (student: UserProfile) => void;
  onEnterAthleteMode?: () => void;
  onOpenChangePassword?: () => void;
}

export const ProfessorScreen: React.FC<ProfessorScreenProps> = ({
  currentUser,
  onLogout,
  onOpenSettings,
  onSimulateStudent,
  onEnterAthleteMode,
  onOpenChangePassword,
}) => {
  const isMaster = isUserAdmin(currentUser);

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'pendentes' | 'inativos'>('todos');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  // Gerenciamento de Personais (Exclusivo Master Admin)
  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [showInviteInstructorModal, setShowInviteInstructorModal] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstEmail, setNewInstEmail] = useState('');
  const [newInstPhone, setNewInstPhone] = useState('');
  const [invitedInstData, setInvitedInstData] = useState<{
    instructor: UserProfile;
    shareLink: string;
    whatsappUrl: string;
    emailSent: boolean;
  } | null>(null);
  const [isInvitingInst, setIsInvitingInst] = useState(false);
  const [copiedInstLink, setCopiedInstLink] = useState(false);

  // Modelos de Treino (Templates Reutilizáveis)
  const [templates, setTemplates] = useState<WorkoutPlanTemplate[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [targetStudentForTemplate, setTargetStudentForTemplate] = useState<UserProfile | null>(null);
  const [saveAsTemplatePlan, setSaveAsTemplatePlan] = useState<WorkoutPlan | null>(null);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState<string | null>(null);

  // Editor de Modelos de Treino (Criar / Editar)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutPlanTemplate | null>(null);
  const [editTplCategory, setEditTplCategory] = useState('Treino A');
  const [editTplName, setEditTplName] = useState('');
  const [editTplDesc, setEditTplDesc] = useState('');
  const [editTplExercises, setEditTplExercises] = useState<ExerciseTemplate[]>([]);
  const [showAddExToTemplate, setShowAddExToTemplate] = useState(false);
  const [tplExSearch, setTplExSearch] = useState('');
  const [tplExMuscle, setTplExMuscle] = useState<string>('Todos');

  // Logs do Sistema
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Reset de Senha de Aluno por Personal/Master
  const [resetPasswordStudent, setResetPasswordStudent] = useState<UserProfile | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    whatsappUrl: string;
    shareLink: string;
    emailSent: boolean;
    error?: string;
  } | null>(null);
  const [isResettingStudentPass, setIsResettingStudentPass] = useState(false);
  const [copiedResetLink, setCopiedResetLink] = useState(false);

  // Dados do aluno selecionado
  const [studentPlans, setStudentPlans] = useState<WorkoutPlan[]>([]);
  const [studentLogs, setStudentLogs] = useState<WorkoutLog[]>([]);
  const [studentWeights, setStudentWeights] = useState<WeightEntry[]>([]);

  // Modais
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showNewExerciseModal, setShowNewExerciseModal] = useState<string | null>(null);

  // Modal de Exercício: Biblioteca Pré-Mapeada vs Manual
  const [exerciseModalTab, setExerciseModalTab] = useState<'preset' | 'manual'>('preset');
  const [presetSearch, setPresetSearch] = useState('');
  const [presetMuscleFilter, setPresetMuscleFilter] = useState<string>('Todos');
  const [recentlyAddedExId, setRecentlyAddedExId] = useState<string | null>(null);

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

  // Formulários de Treino e Exercício Manual
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
    if (selectedStudent) {
      const updated = list.find((s) => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  };

  const loadTemplates = async () => {
    const list = await syncTemplatesWithCloud();
    setTemplates(list);
  };

  const loadInstructors = async () => {
    if (!isMaster) return;
    const list = await getInstructorsList();
    setInstructors(list);
  };

  useEffect(() => {
    loadStudents();
    loadTemplates();
    if (isMaster) {
      loadInstructors();
    }
  }, [currentUser]);

  const handleApproveStudent = async (studentToApprove: UserProfile) => {
    setIsUpdatingStatus(true);
    try {
      await setStudentActiveStatus(studentToApprove.id, 'ativo');
      const updated = { ...studentToApprove, status: 'ativo' as UserStatus };
      setStudents((prev) => prev.map((s) => (s.id === studentToApprove.id ? updated : s)));
      if (selectedStudent?.id === studentToApprove.id) {
        setSelectedStudent(updated);
      }
      addSystemLog('success', 'AUTH', `Acesso do aluno aprovado (OK): ${studentToApprove.name} (${studentToApprove.email})`);
    } catch (err: any) {
      alert('Erro ao aprovar aluno: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleApproveInstructor = async (inst: UserProfile) => {
    try {
      await setStudentActiveStatus(inst.id, 'ativo');
      setInstructors((prev) => prev.map((i) => (i.id === inst.id ? { ...i, status: 'ativo' as UserStatus } : i)));
      addSystemLog('success', 'AUTH', `Personal aprovado pelo Master: ${inst.name} (${inst.email})`);
    } catch (e: any) {
      alert('Erro ao aprovar personal: ' + e?.message);
    }
  };

  const handleToggleInstructorStatus = async (inst: UserProfile) => {
    const currentStatus = inst.status || 'ativo';
    const newStatus: UserStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    if (!confirm(`Deseja realmente ${newStatus === 'inativo' ? 'desativar' : 'reativar'} o personal ${inst.name}?`)) return;
    try {
      await setStudentActiveStatus(inst.id, newStatus);
      setInstructors((prev) => prev.map((i) => (i.id === inst.id ? { ...i, status: newStatus } : i)));
      addSystemLog('warn', 'AUTH', `Status do personal ${inst.email} alterado para ${newStatus}`);
    } catch (e: any) {
      alert('Erro ao alterar status do personal: ' + e?.message);
    }
  };

  const handleInviteInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstEmail.trim()) {
      alert('Nome e e-mail são obrigatórios.');
      return;
    }
    setIsInvitingInst(true);
    try {
      const res = await inviteInstructor(newInstName, newInstEmail, newInstPhone);
      setInvitedInstData(res);
      setInstructors((prev) => [...prev.filter((i) => i.email !== res.instructor.email), res.instructor]);
      setNewInstName('');
      setNewInstEmail('');
      setNewInstPhone('');
    } catch (e: any) {
      alert('Erro ao convidar personal: ' + e?.message);
    } finally {
      setIsInvitingInst(false);
    }
  };

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

      setInviteResult({
        student: res.student,
        emailSent: res.emailSent,
        whatsappUrl: res.whatsappUrl,
        shareLink: res.shareLink,
        error: res.error,
      });

      await loadStudents();
    } catch (err: any) {
      alert('Erro ao convidar aluno: ' + (err?.message || 'Tente novamente'));
    } finally {
      setIsInviting(false);
    }
  };

  // Reset de senha do aluno pelo Personal ou Admin Master
  const handleResetStudentPassword = async (student: UserProfile) => {
    const confirmMsg = `Deseja realmente resetar a senha de ${student.name}? No próximo acesso ao app, o aluno será solicitado a escolher uma nova senha.`;
    if (!confirm(confirmMsg)) return;

    setIsResettingStudentPass(true);
    try {
      const res = await resetStudentPasswordByInstructor(currentUser, student);
      setResetPasswordResult({
        whatsappUrl: res.whatsappUrl,
        shareLink: res.shareLink,
        emailSent: res.emailSent,
        error: res.error,
      });
      setResetPasswordStudent(student);
      await loadStudents();
    } catch (err: any) {
      alert('Erro ao resetar senha: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsResettingStudentPass(false);
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

  // Adiciona exercício manual/personalizado
  const handleAddManualExercise = async (e: React.FormEvent) => {
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

  // Adiciona exercício pré-mapeado da biblioteca diretamente à ficha
  const handleAddPresetExercise = async (preset: PresetExercise) => {
    if (!selectedStudent || !showNewExerciseModal) return;

    const newEx: ExerciseTemplate = {
      id: `ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: preset.name,
      muscleGroup: preset.muscleGroup,
      targetSets: preset.defaultSets,
      targetReps: preset.defaultReps,
      restSeconds: preset.defaultRestSeconds,
      lastWeightKg: preset.defaultWeightKg,
      notes: preset.notes,
    };

    const targetPlan = studentPlans.find((p) => p.id === showNewExerciseModal);
    if (targetPlan) {
      targetPlan.exercises.push(newEx);
      savePlanForStudent(targetPlan);
      await uploadPlanToCloud(targetPlan);
      refreshStudentData(selectedStudent.id);

      setRecentlyAddedExId(preset.id);
      setTimeout(() => setRecentlyAddedExId(null), 1500);
    }
  };

  // Carrega exercício pré-mapeado no formulário manual para ajustes finos
  const handleSelectPresetToCustomize = (preset: PresetExercise) => {
    setExName(preset.name);
    setExMuscle(preset.muscleGroup);
    setExSets(preset.defaultSets);
    setExReps(preset.defaultReps);
    setExRest(preset.defaultRestSeconds);
    setExWeight(preset.defaultWeightKg);
    setExerciseModalTab('manual');
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

  // ==========================================
  // FUNÇÕES DE MODELOS / TEMPLATES
  // ==========================================

  const handleOpenSaveAsTemplate = (plan: WorkoutPlan) => {
    setSaveAsTemplatePlan(plan);
    setTemplateNameInput(plan.name);
  };

  const handleConfirmSaveAsTemplate = () => {
    if (!saveAsTemplatePlan) return;
    const created = savePlanAsTemplate(saveAsTemplatePlan, currentUser.id, templateNameInput);
    setTemplates((prev) => [...prev.filter((t) => t.id !== created.id), created]);
    setSaveAsTemplatePlan(null);
    setTemplateFeedback(`Ficha "${created.name}" salva como modelo com sucesso!`);
    setTimeout(() => setTemplateFeedback(null), 3500);
  };

  const handleApplyTemplate = async (template: WorkoutPlanTemplate, student: UserProfile) => {
    setIsApplyingTemplate(true);
    try {
      await applyTemplateToStudent(template, student.id, currentUser.id);
      if (selectedStudent && selectedStudent.id === student.id) {
        refreshStudentData(student.id);
      }
      setShowTemplatesModal(false);
      setTemplateFeedback(`Modelo "${template.name}" aplicado em ${student.name} com sucesso!`);
      setTimeout(() => setTemplateFeedback(null), 3500);
    } catch (err: any) {
      alert('Erro ao aplicar modelo: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Deseja realmente excluir este modelo de treino salvo?')) {
      deletePlanTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  };

  // Abre criação de novo modelo do zero
  const handleOpenCreateNewTemplate = () => {
    setEditingTemplate({
      id: `template-${Date.now()}`,
      createdBy: currentUser.id,
      category: 'Treino A',
      name: '',
      description: '',
      exercises: [],
      createdAt: new Date().toISOString(),
    });
    setEditTplCategory('Treino A');
    setEditTplName('');
    setEditTplDesc('');
    setEditTplExercises([]);
  };

  // Abre edição de um modelo existente
  const handleOpenEditTemplate = (tpl: WorkoutPlanTemplate) => {
    setEditingTemplate(tpl);
    setEditTplCategory(tpl.category);
    setEditTplName(tpl.name);
    setEditTplDesc(tpl.description || '');
    setEditTplExercises([...tpl.exercises]);
  };

  // Salva modelo criado ou editado
  const handleSaveEditedTemplate = () => {
    if (!editingTemplate || !editTplName.trim()) return;

    const updated: WorkoutPlanTemplate = {
      ...editingTemplate,
      category: editTplCategory.trim() || 'Treino',
      name: editTplName.trim(),
      description: editTplDesc.trim(),
      exercises: editTplExercises,
      createdBy: currentUser.id, // assegura posse do personal
    };

    saveOrUpdatePlanTemplate(updated);
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });

    setEditingTemplate(null);
    setTemplateFeedback(`Modelo "${updated.name}" salvo com sucesso!`);
    setTimeout(() => setTemplateFeedback(null), 3500);
  };

  // Adiciona exercício ao modelo sendo editado
  const handleAddPresetToTemplate = (preset: PresetExercise) => {
    const newEx: ExerciseTemplate = {
      id: `tpl-ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: preset.name,
      muscleGroup: preset.muscleGroup,
      targetSets: preset.defaultSets,
      targetReps: preset.defaultReps,
      restSeconds: preset.defaultRestSeconds,
      lastWeightKg: preset.defaultWeightKg,
      notes: preset.notes,
    };
    setEditTplExercises((prev) => [...prev, newEx]);
    setShowAddExToTemplate(false);
  };

  const handleRemoveExerciseFromTemplate = (exId: string) => {
    setEditTplExercises((prev) => prev.filter((e) => e.id !== exId));
  };

  const activeCount = students.filter((s) => (s.status || 'ativo') === 'ativo').length;
  const pendingCount = students.filter((s) => s.status === 'pendente').length;
  const inactiveCount = students.filter((s) => s.status === 'inativo').length;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const status = s.status || 'ativo';

    if (statusFilter === 'ativos') return matchesSearch && status === 'ativo';
    if (statusFilter === 'pendentes') return matchesSearch && status === 'pendente';
    if (statusFilter === 'inativos') return matchesSearch && status === 'inativo';
    return matchesSearch;
  });

  const filteredPresets = PRESET_EXERCISES.filter((ex) => {
    const matchesGroup = presetMuscleFilter === 'Todos' || ex.muscleGroup === presetMuscleFilter;
    const matchesSearch =
      ex.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(presetSearch.toLowerCase()) ||
      (ex.notes && ex.notes.toLowerCase().includes(presetSearch.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  const filteredTplPresets = PRESET_EXERCISES.filter((ex) => {
    const matchesGroup = tplExMuscle === 'Todos' || ex.muscleGroup === tplExMuscle;
    const matchesSearch =
      ex.name.toLowerCase().includes(tplExSearch.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(tplExSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Top Header do Professor / Admin */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 pt-safe pb-2">
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
            {/* Botão de Modo Atleta para a Conta Master treinar como aluno */}
            {isMaster && onEnterAthleteMode && (
              <button
                onClick={onEnterAthleteMode}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white transition flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95"
                title="Meu Treino Pessoal (Modo Atleta)"
              >
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Meu Treino</span>
              </button>
            )}

            {/* Gerenciar Personais (Exclusivo Master Admin) */}
            {isMaster && (
              <button
                onClick={() => {
                  loadInstructors();
                  setShowInstructorsModal(true);
                }}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white transition flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95"
                title="Gerenciar Personal Trainers"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Personais</span>
                {instructors.filter((i) => i.status === 'pendente').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            )}

            {/* Logs do Sistema (Exclusivo Master Admin) */}
            {isMaster && (
              <button
                onClick={() => setShowLogsModal(true)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                title="Histórico de Logs do Sistema"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}

            {/* Botão do Banco Supabase (Exclusivo Master Admin) */}
            {isMaster && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-400 hover:text-white transition"
                title="Configurações do Banco Supabase"
              >
                <Database className="w-4 h-4" />
              </button>
            )}

            {/* Alterar Própria Senha */}
            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title="Alterar Minha Senha"
              >
                <KeyRound className="w-4 h-4" />
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

      {/* Alerta de Feedback de Modelo */}
      {templateFeedback && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold">{templateFeedback}</p>
          </div>
        </div>
      )}

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

            {/* Cartão do Aluno com Status de Ativação e Reset de Senha */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedStudent.name}</h2>
                      {selectedStudent.status === 'pendente' ? (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                          AGUARDANDO LIBERAÇÃO
                        </span>
                      ) : selectedStudent.status === 'inativo' ? (
                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                          INATIVO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ATIVO
                        </span>
                      )}
                      {selectedStudent.mustResetPassword && (
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                          RESET PENDENTE
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

              {/* Botões de Ação da Conta (Liberar/Desativar/Reativar e Resetar Senha) */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleResetStudentPassword(selectedStudent)}
                  disabled={isResettingStudentPass}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-950/40 border border-zinc-700/80 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Resetar a senha deste aluno para que ele crie uma nova"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isResettingStudentPass ? 'Resetando...' : 'Resetar Senha'}</span>
                </button>

                {selectedStudent.status === 'pendente' ? (
                  <button
                    onClick={() => handleApproveStudent(selectedStudent)}
                    disabled={isUpdatingStatus}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50 active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isUpdatingStatus ? 'Liberando...' : 'Liberar Acesso (OK)'}</span>
                  </button>
                ) : selectedStudent.status === 'inativo' ? (
                  <button
                    onClick={handleToggleStudentStatus}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isUpdatingStatus ? 'Reativando...' : 'Reativar Conta'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleToggleStudentStatus}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-rose-900/30 border border-zinc-700/60 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isUpdatingStatus ? 'Atualizando...' : 'Desativar Aluno'}</span>
                  </button>
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
                  <p className="text-[11px] text-zinc-400">Monte, replique modelos ou personalize</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setTargetStudentForTemplate(selectedStudent);
                      setShowTemplatesModal(true);
                    }}
                    className="flex items-center space-x-1.5 py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition"
                    title="Replicar modelo salvo para este aluno"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Usar Modelo</span>
                  </button>
                  <button
                    onClick={() => setShowNewPlanModal(true)}
                    className="flex items-center space-x-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Ficha</span>
                  </button>
                </div>
              </div>

              {studentPlans.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-zinc-900 border border-dashed border-zinc-800 text-zinc-400 text-xs space-y-3">
                  <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-zinc-300">Nenhum treino montado ainda.</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Você pode criar uma nova ficha do zero ou importar um modelo salvo com 1 clique!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTargetStudentForTemplate(selectedStudent);
                      setShowTemplatesModal(true);
                    }}
                    className="inline-flex items-center space-x-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Importar de um Modelo Pronto</span>
                  </button>
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
                          {/* Salvar como Modelo Reutilizável */}
                          <button
                            onClick={() => handleOpenSaveAsTemplate(plan)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-400 text-xs flex items-center gap-1 font-semibold transition"
                            title="Salvar esta ficha como modelo para usar em outros alunos"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">Salvar Modelo</span>
                          </button>

                          {/* Adicionar Exercício */}
                          <button
                            onClick={() => {
                              setShowNewExerciseModal(plan.id);
                              setExerciseModalTab('preset');
                              setPresetSearch('');
                              setPresetMuscleFilter('Todos');
                            }}
                            className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1 font-semibold transition"
                            title="Adicionar Exercício"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Exercício</span>
                          </button>

                          {/* Excluir Ficha */}
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
                          <div className="py-4 text-center">
                            <p className="text-[11px] text-zinc-500 mb-2">
                              Nenhum exercício ainda nesta ficha.
                            </p>
                            <button
                              onClick={() => {
                                setShowNewExerciseModal(plan.id);
                                setExerciseModalTab('preset');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-600/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Escolher da Biblioteca Pré-Mapeada</span>
                            </button>
                          </div>
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
                                {ex.notes && (
                                  <p className="text-[10px] text-zinc-500 mt-0.5">{ex.notes}</p>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteExercise(plan.id, ex.id)}
                                className="p-1 text-zinc-600 hover:text-red-400 transition"
                                title="Remover exercício"
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
            {/* Banner com botões de Convidar Aluno e Modelos Salvos */}
            <div className="bg-gradient-to-br from-purple-950/60 to-zinc-900 border border-purple-500/20 rounded-3xl p-4 shadow-lg space-y-3">
              <div className="flex items-start justify-between">
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
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setTargetStudentForTemplate(null);
                    setShowTemplatesModal(true);
                  }}
                  className="py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-indigo-300 rounded-2xl text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                  title="Ver e gerenciar fichas modelos salvas"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Modelos de Treino ({templates.length})</span>
                </button>

                <button
                  onClick={() => {
                    setInviteResult(null);
                    setInviteName('');
                    setInviteEmail('');
                    setInvitePhone('');
                    setShowInviteModal(true);
                  }}
                  className="flex-1 py-2.5 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/30 active:scale-95 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Convidar Aluno</span>
                </button>
              </div>
            </div>

            {/* Aviso de Alunos Pendentes de Liberação (OK) */}
            {pendingCount > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-200">
                      {pendingCount} aluno{pendingCount > 1 ? 's' : ''} aguardando sua liberação!
                    </h4>
                    <p className="text-[11px] text-amber-300/70">
                      Dê o OK para liberar o acesso às fichas de treino.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStatusFilter('pendentes')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition active:scale-95 shadow-sm"
                >
                  Ver Pendentes
                </button>
              </div>
            )}

            {/* Filtros de Status (Todos / Ativos / Pendentes / Inativos) */}
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
                onClick={() => setStatusFilter('pendentes')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                  statusFilter === 'pendentes'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Pendentes</span>
                {pendingCount > 0 && (
                  <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
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
                  const isPending = student.status === 'pendente';

                  return (
                    <div
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition active:scale-99 shadow-sm ${
                        isPending
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                          : isInactive
                          ? 'bg-zinc-900/60 border-zinc-800/60 opacity-75 hover:opacity-100 hover:border-zinc-700'
                          : 'bg-zinc-900 border-zinc-800 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${
                            isPending
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : isInactive
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          }`}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{student.name}</h4>
                            {isPending ? (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                Aguardando OK
                              </span>
                            ) : isInactive ? (
                              <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                                Inativo
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Ativo
                              </span>
                            )}
                            {student.mustResetPassword && (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                Reset
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

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveStudent(student);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                            title="Dar OK e liberar acesso do aluno"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Liberar</span>
                          </button>
                        )}
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

      {/* ======================================================== */}
      {/* MODAL: RESET DE SENHA DE ALUNO PELO PERSONAL / MASTER */}
      {/* ======================================================== */}
      {resetPasswordStudent && resetPasswordResult && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-safe shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Senha do Aluno Resetada</h3>
              </div>
              <button
                onClick={() => {
                  setResetPasswordStudent(null);
                  setResetPasswordResult(null);
                }}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-center pt-2">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  Acesso de {resetPasswordStudent.name} resetado com sucesso!
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  No próximo acesso ao aplicativo, o aluno precisará cadastrar uma nova senha.
                  {resetPasswordResult.emailSent && (
                    <span className="block text-emerald-400 mt-1 font-semibold">
                      ✓ E-mail com link de redefinição enviado para {resetPasswordStudent.email}
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {/* Botão de WhatsApp */}
                <a
                  href={resetPasswordResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar Link pelo WhatsApp</span>
                </a>

                {/* Botão Copiar Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetPasswordResult.shareLink);
                    setCopiedResetLink(true);
                    setTimeout(() => setCopiedResetLink(false), 2000);
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  {copiedResetLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedResetLink ? 'Link Copiado!' : 'Copiar Link de Acesso'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setResetPasswordStudent(null);
                  setResetPasswordResult(null);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR EXERCÍCIO (BIBLIOTECA PRÉ-MAPEADA / MANUAL) */}
      {/* ======================================================== */}
      {showNewExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 pb-safe shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Adicionar Exercício à Ficha</h3>
                <p className="text-[11px] text-zinc-400">Escolha da biblioteca pronta ou crie manualmente</p>
              </div>
              <button
                onClick={() => setShowNewExerciseModal(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Abas: Prontos vs Manual */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 my-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setExerciseModalTab('preset')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  exerciseModalTab === 'preset'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Biblioteca Pronta ({filteredPresets.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setExerciseModalTab('manual')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  exerciseModalTab === 'manual'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Manualmente</span>
              </button>
            </div>

            {/* ABA 1: BIBLIOTECA DE EXERCÍCIOS PRÉ-MAPEADOS */}
            {exerciseModalTab === 'preset' ? (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Busca e Filtros */}
                <div className="space-y-2 flex-shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar exercício (ex: Supino, Puxada, Agachamento...)"
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Pills de Grupos Musculares com Rolagem */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setPresetMuscleFilter('Todos')}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                        presetMuscleFilter === 'Todos'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    {MUSCLE_GROUPS.map((group) => (
                      <button
                        key={group}
                        onClick={() => setPresetMuscleFilter(group)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                          presetMuscleFilter === group
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Exercícios Pré-Mapeados */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                  {filteredPresets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      Nenhum exercício encontrado para "{presetSearch}".
                    </div>
                  ) : (
                    filteredPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="bg-zinc-950/80 border border-zinc-800/80 hover:border-purple-500/40 rounded-xl p-2.5 transition flex items-center justify-between"
                      >
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-white">{preset.name}</h5>
                            <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                              {preset.muscleGroup}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                            <span>{preset.defaultSets} séries</span>
                            <span>•</span>
                            <span>{preset.defaultReps} reps</span>
                            <span>•</span>
                            <span>{preset.defaultRestSeconds}s descanso</span>
                            {preset.defaultWeightKg > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-300 font-semibold">{preset.defaultWeightKg} kg</span>
                              </>
                            )}
                          </div>
                          {preset.notes && (
                            <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{preset.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectPresetToCustomize(preset)}
                            className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium transition"
                            title="Ajustar repetições ou carga antes de adicionar"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPresetExercise(preset)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              recentlyAddedExId === preset.id
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                            }`}
                          >
                            {recentlyAddedExId === preset.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Adicionado!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNewExerciseModal(null)}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Concluir e Voltar à Ficha
                  </button>
                </div>
              </div>
            ) : (
              /* ABA 2: FORMULÁRIO MANUAL */
              <form onSubmit={handleAddManualExercise} className="space-y-3 pt-1 flex-1 overflow-y-auto">
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
                      {MUSCLE_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
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
                  className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg text-xs transition"
                >
                  Salvar Exercício na Ficha
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MODELOS / TEMPLATES DE FICHAS DE TREINO */}
      {/* ======================================================== */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 pb-safe shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {targetStudentForTemplate
                      ? `Aplicar Modelo em ${targetStudentForTemplate.name}`
                      : 'Modelos de Fichas de Treino'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Crie, edite e replique fichas prontas para qualquer aluno
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTemplatesModal(false);
                  setTargetStudentForTemplate(null);
                }}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Botão de Criar Novo Modelo */}
            <div className="pt-3 pb-1 flex-shrink-0">
              <button
                onClick={handleOpenCreateNewTemplate}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-98 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar Novo Modelo de Treino</span>
              </button>
            </div>

            {/* Lista de Modelos Salvos */}
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 min-h-[260px]">
              {templates.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Nenhum modelo cadastrado ainda.
                </div>
              ) : (
                templates.map((tpl) => {
                  const isPersonalTemplate = tpl.createdBy === currentUser.id || tpl.createdBy !== 'global';

                  return (
                    <div
                      key={tpl.id}
                      className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5 shadow-sm hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                              {tpl.category}
                            </span>
                            {isPersonalTemplate && (
                              <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                                MEU MODELO
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white">{tpl.name}</h4>
                          {tpl.description && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">{tpl.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Botão de Editar Modelo */}
                          <button
                            onClick={() => handleOpenEditTemplate(tpl)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                            title="Editar este modelo (nome, exercícios)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão de Excluir Modelo */}
                          {isPersonalTemplate && (
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400 transition"
                              title="Excluir este modelo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Preview dos Exercícios */}
                      <div className="bg-zinc-900/90 rounded-xl p-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1.5">
                          <span>Exercícios ({tpl.exercises.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tpl.exercises.slice(0, 5).map((ex, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-700/60"
                            >
                              {ex.name}
                            </span>
                          ))}
                          {tpl.exercises.length > 5 && (
                            <span className="text-[10px] text-zinc-500 self-center">
                              +{tpl.exercises.length - 5} outros
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botão de Ação: Aplicar no Aluno */}
                      {targetStudentForTemplate ? (
                        <button
                          onClick={() => handleApplyTemplate(tpl, targetStudentForTemplate)}
                          disabled={isApplyingTemplate}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-98 transition disabled:opacity-50"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>
                            {isApplyingTemplate ? 'Aplicando Treino...' : `Aplicar em ${targetStudentForTemplate.name}`}
                          </span>
                        </button>
                      ) : (
                        /* Se aberto do painel geral, permite selecionar o aluno */
                        <div className="pt-1">
                          <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                            Replicar esta ficha para um aluno:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const st = students.find((s) => s.id === e.target.value);
                                if (st) handleApplyTemplate(tpl, st);
                              }}
                              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="" disabled>
                                Escolha o aluno para receber este treino...
                              </option>
                              {students
                                .filter((s) => (s.status || 'ativo') === 'ativo')
                                .map((st) => (
                                  <option key={st.id} value={st.id}>
                                    {st.name} ({st.email})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITOR DE MODELO DE TREINO (CRIAR OU EDITAR) */}
      {/* ======================================================== */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 pb-safe shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingTemplate.name ? `Editar: ${editingTemplate.name}` : 'Criar Novo Modelo de Treino'}
                </h3>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Divisão / Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Treino A, Treino B..."
                    value={editTplCategory}
                    onChange={(e) => setEditTplCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Peito & Tríceps Hipertrofia"
                    value={editTplName}
                    onChange={(e) => setEditTplName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição / Foco</label>
                <input
                  type="text"
                  placeholder="Ex: Foco em sobrecarga progressiva e cadência"
                  value={editTplDesc}
                  onChange={(e) => setEditTplDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Lista de Exercícios do Modelo */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Exercícios Incluídos ({editTplExercises.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExToTemplate(true);
                      setTplExSearch('');
                      setTplExMuscle('Todos');
                    }}
                    className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Exercício</span>
                  </button>
                </div>

                {editTplExercises.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-zinc-950/70 border border-dashed border-zinc-800 text-zinc-500 text-xs">
                    Nenhum exercício adicionado a este modelo ainda.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {editTplExercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{ex.name}</span>
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                              {ex.muscleGroup}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {ex.targetSets} séries • {ex.targetReps} reps • {ex.restSeconds}s
                            {ex.lastWeightKg ? ` • ${ex.lastWeightKg} kg` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseFromTemplate(ex.id)}
                          className="p-1 text-zinc-600 hover:text-red-400 transition"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedTemplate}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition active:scale-98"
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ESCOLHER EXERCÍCIO PARA O MODELO */}
      {showAddExToTemplate && (
        <div className="fixed inset-0 z-55 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
              <h4 className="text-sm font-bold text-white">Escolher Exercício para o Modelo</h4>
              <button
                onClick={() => setShowAddExToTemplate(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2.5 space-y-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={tplExSearch}
                onChange={(e) => setTplExSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500"
              />

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setTplExMuscle('Todos')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                    tplExMuscle === 'Todos' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Todos
                </button>
                {MUSCLE_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setTplExMuscle(g)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                      tplExMuscle === g ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
              {filteredTplPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleAddPresetToTemplate(preset)}
                  className="bg-zinc-950 border border-zinc-800/80 hover:border-purple-500/50 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition active:scale-99"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{preset.name}</h5>
                    <p className="text-[10px] text-zinc-400">
                      {preset.muscleGroup} • {preset.defaultSets}x{preset.defaultReps} • {preset.defaultRestSeconds}s
                    </p>
                  </div>
                  <button className="px-2 py-1 rounded-lg bg-purple-600/20 text-purple-300 text-[10px] font-bold">
                    + Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SALVAR FICHA ATUAL COMO MODELO */}
      {/* ======================================================== */}
      {saveAsTemplatePlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Salvar Ficha como Modelo</h3>
              </div>
              <button
                onClick={() => setSaveAsTemplatePlan(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Este treino ficará salvo na sua biblioteca de modelos com todos os{' '}
                <span className="text-white font-semibold">
                  {saveAsTemplatePlan.exercises.length} exercícios
                </span>
                , pronto para ser replicado para qualquer aluno que você desejar.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: Treino A - Hipertrofia Peitoral"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-300 space-y-1">
                <p>
                  <span className="text-zinc-500">Divisão:</span>{' '}
                  <span className="text-indigo-400 font-bold">{saveAsTemplatePlan.category}</span>
                </p>
                <p>
                  <span className="text-zinc-500">Exercícios incluídos:</span>{' '}
                  <span className="text-white">{saveAsTemplatePlan.exercises.length}</span>
                </p>
              </div>

              <button
                onClick={handleConfirmSaveAsTemplate}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-xs flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Salvar Modelo na Biblioteca</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONVIDAR ALUNO (E-MAIL + WHATSAPP) */}
      {/* ======================================================== */}
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
                  <h4 className="text-base font-bold text-white">Aluno Cadastrado com Sucesso!</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {inviteResult.emailSent ? (
                      <>
                        Um e-mail foi disparado para <span className="text-white font-semibold">{inviteResult.student.email}</span>.
                      </>
                    ) : (
                      <>
                        O acesso de <span className="text-white font-semibold">{inviteResult.student.name}</span> está pronto!
                      </>
                    )}
                    <span className="block mt-1 text-zinc-300">
                      Envie o link direto de primeiro acesso pelo WhatsApp abaixo para que o aluno defina sua senha instantaneamente:
                    </span>
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

      {/* ======================================================== */}
      {/* MODAL: NOVA FICHA PARA O ALUNO (DO ZERO) */}
      {/* ======================================================== */}
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

      {/* ======================================================== */}
      {/* MODAL: GERENCIAR PERSONAL TRAINERS (MASTER ADMIN) */}
      {/* ======================================================== */}
      {showInstructorsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 pb-safe shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Personal Trainers</h3>
                  <p className="text-[11px] text-zinc-400">
                    Aprovação e autorização de professores na plataforma
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructorsModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ação: Convidar Novo Personal */}
            <div className="pt-3 pb-2 flex-shrink-0">
              <button
                onClick={() => {
                  setInvitedInstData(null);
                  setShowInviteInstructorModal(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Convidar Novo Personal Trainer</span>
              </button>
            </div>

            {/* Lista de Personais */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {instructors.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Nenhum personal trainer encontrado.
                </div>
              ) : (
                instructors.map((inst) => {
                  const isInstMaster = inst.email.toLowerCase() === 'igormoraes792@gmail.com';
                  const isPending = inst.status === 'pendente';
                  const isInactive = inst.status === 'inativo';

                  return (
                    <div
                      key={inst.id}
                      className={`border rounded-2xl p-3 flex items-center justify-between transition ${
                        isPending
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : isInactive
                          ? 'bg-zinc-900/50 border-zinc-800/60 opacity-70'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isPending
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : isInactive
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          }`}
                        >
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">{inst.name}</span>
                            {isInstMaster && (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                Master
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                Aguardando Aprovação
                              </span>
                            )}
                            {isInactive && (
                              <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                                Inativo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">{inst.email}</div>
                        </div>
                      </div>

                      {/* Ações */}
                      {!isInstMaster && (
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {isPending && (
                            <button
                              onClick={() => handleApproveInstructor(inst)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                              title="Aprovar e Liberar Personal"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleInstructorStatus(inst)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                              isInactive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                            }`}
                            title={isInactive ? 'Reativar Personal' : 'Desativar Personal'}
                          >
                            {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONVIDAR PERSONAL TRAINER (MASTER ADMIN) */}
      {/* ======================================================== */}
      {showInviteInstructorModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Convidar Personal Trainer</h3>
                  <p className="text-[11px] text-zinc-400">Autorizado diretamente pela conta Master</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowInviteInstructorModal(false);
                  setInvitedInstData(null);
                }}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {invitedInstData ? (
              /* RESULTADO DO CONVITE */
              <div className="pt-4 space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Personal Cadastrado & Liberado!</h4>
                    <p className="text-[11px] text-zinc-400">
                      O acesso de <span className="text-white font-semibold">{invitedInstData.instructor.name}</span> foi autorizado como Personal Trainer.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300">
                  Envie o link de primeiro acesso para o Personal cadastrar sua senha:
                </p>

                <div className="space-y-2">
                  {/* Botão WhatsApp */}
                  <a
                    href={invitedInstData.whatsappUrl}
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
                      navigator.clipboard.writeText(invitedInstData.shareLink);
                      setCopiedInstLink(true);
                      setTimeout(() => setCopiedInstLink(false), 2000);
                    }}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    {copiedInstLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedInstLink ? 'Link Copiado!' : 'Copiar Link de Acesso'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowInviteInstructorModal(false);
                    setInvitedInstData(null);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                >
                  Concluir e Fechar
                </button>
              </div>
            ) : (
              /* FORMULÁRIO DO CONVITE */
              <form onSubmit={handleInviteInstructor} className="space-y-3 pt-3">
                <p className="text-xs text-zinc-400">
                  Somente você (Master) pode cadastrar ou autorizar novos Personal Trainers. Ao cadastrar, o acesso é criado como <span className="text-emerald-400 font-semibold">Ativo</span>.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo do Personal</label>
                  <input
                    type="text"
                    placeholder="Ex: Treinador Roberto Alencar"
                    value={newInstName}
                    onChange={(e) => setNewInstName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">E-mail do Personal</label>
                  <input
                    type="email"
                    placeholder="personal@exemplo.com"
                    value={newInstEmail}
                    onChange={(e) => setNewInstEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">WhatsApp / Telefone (opcional)</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={newInstPhone}
                    onChange={(e) => setNewInstPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isInvitingInst}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 text-xs flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isInvitingInst ? 'Cadastrando e Gerando Link...' : 'Cadastrar e Autorizar Personal'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Logs do Sistema (Exclusivo Master Admin) */}
      <SystemLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
      />
    </div>
  );
};
