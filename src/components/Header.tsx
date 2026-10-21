import React from 'react';
import { Dumbbell, LogOut, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  onLogout: () => void;
  isSimulating?: boolean;
  onExitSimulation?: () => void;
  onOpenChangePassword?: () => void;
  isMasterAthlete?: boolean;
  onExitMasterAthlete?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  isSimulating,
  onExitSimulation,
  onOpenChangePassword,
  isMasterAthlete,
  onExitMasterAthlete,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 pt-safe">
      {/* Banner se a conta master estiver em modo atleta pessoal */}
      {isMasterAthlete && onExitMasterAthlete && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 px-4 py-2.5 text-xs font-bold text-white flex items-center justify-between shadow-md border-b border-amber-500/40">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="truncate">Modo Atleta • Igor Moraes</span>
          </span>
          <button
            onClick={onExitMasterAthlete}
            className="flex items-center gap-1 bg-black/30 hover:bg-black/50 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition active:scale-95 shadow-sm shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel Master</span>
          </button>
        </div>
      )}

      {/* Banner se o professor estiver simulando a visão do aluno */}
      {isSimulating && onExitSimulation && !isMasterAthlete && (
        <div className="bg-purple-600 px-4 py-2.5 text-xs font-bold text-white flex items-center justify-between shadow-md border-b border-purple-500/40">
          <span className="flex items-center gap-1.5">
            <span className="truncate">👁️ Simulando aluno: <strong>{currentUser.name}</strong></span>
          </span>
          <button
            onClick={onExitSimulation}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition active:scale-95 shadow-sm shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Personal</span>
          </button>
        </div>
      )}

      <div className="px-4 py-2">
        <div className="flex items-center justify-between h-12 max-w-lg mx-auto">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                  FitTrack
                </h1>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${
                  isMasterAthlete
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                }`}>
                  {isMasterAthlete ? 'MASTER ATLETA' : 'ALUNO'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">
                {currentUser.name} {currentUser.instructorName && !isMasterAthlete ? `• Personal: ${currentUser.instructorName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition active:scale-95"
                title="Alterar Minha Senha"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition active:scale-95"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
