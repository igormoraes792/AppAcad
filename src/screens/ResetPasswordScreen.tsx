import React, { useState } from 'react';
import { Lock, CheckCircle2, ArrowRight, AlertCircle, Dumbbell } from 'lucide-react';
import { updateUserPassword } from '../lib/auth';

interface ResetPasswordScreenProps {
  onPasswordResetDone: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onPasswordResetDone }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    const res = await updateUserPassword(newPassword);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onPasswordResetDone();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Erro ao redefinir a senha.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 mx-auto mb-3">
          <Dumbbell className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Criar Nova Senha</h1>
        <p className="text-xs text-zinc-400 mt-1">Digite sua nova senha de acesso</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Senha Alterada com Sucesso!</h3>
            <p className="text-xs text-zinc-400">Você será redirecionado para o seu aplicativo em instantes...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              <span>{loading ? 'Salvando...' : 'Salvar Nova Senha'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
