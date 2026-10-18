import React, { useState } from 'react';
import { Dumbbell, UserCheck, ShieldCheck, ArrowRight, Sparkles, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../lib/auth';
import type { UserProfile, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole>('aluno');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          setErrorMsg('Por favor, informe seu nome.');
          setLoading(false);
          return;
        }
        const res = await registerUser(
          name,
          email,
          password,
          role,
          role === 'aluno' ? 'prof-igor' : undefined,
          role === 'aluno' ? 'Igor Personal' : undefined
        );
        if (res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(res.error || 'Erro ao realizar cadastro.');
        }
      } else {
        const res = await loginUser(email, password);
        if (res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(res.error || 'Credenciais inválidas.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setLoading(true);
    setErrorMsg('');
    const res = await loginUser(quickEmail, '123456');
    if (res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Erro no login rápido.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Logo & Título */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 mx-auto mb-3">
          <Dumbbell className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
          FitTrack
          <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
            PRO
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Treinos montados por seu Personal na Nuvem</p>
      </div>

      {/* Card Principal */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        {/* Toggle Login / Cadastro */}
        <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-2xl mb-5 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegistering
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              isRegistering
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Escolha do tipo de perfil no cadastro */}
          {isRegistering && (
            <div className="space-y-1.5 pb-1">
              <label className="block text-[11px] font-semibold text-zinc-400">Você é:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('aluno')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    role === 'aluno'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Sou Aluno</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('professor')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    role === 'professor'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Sou Personal</span>
                </button>
              </div>
            </div>
          )}

          {isRegistering && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <span>{isRegistering ? 'Cadastrar e Acessar' : 'Entrar no Aplicativo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <span className="relative bg-zinc-900 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Acesso Rápido para Teste
          </span>
        </div>

        {/* Botões de Acesso Rápido */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('igor@personal.com')}
            className="w-full p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 flex items-center justify-between text-left transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                P
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Visão: Igor Personal</span>
                <span className="text-[10px] text-purple-300">Painel do Professor (montar treinos)</span>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('lucas@aluno.com')}
            className="w-full p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-between text-left transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Visão: Aluno Lucas</span>
                <span className="text-[10px] text-indigo-300">Treinos montados, pesos e evolução</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
