import React from 'react';
import { Dumbbell, LogOut, ArrowLeft } from 'lucide-react';
import type { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  onLogout: () => void;
  isSimulating?: boolean;
  onExitSimulation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  isSimulating,
  onExitSimulation,
}) => {
  return (
    <>
      {/* Banner se o professor estiver simulando a visão do aluno */}
      {isSimulating && onExitSimulation && (
        <div className="bg-purple-600 px-4 py-2 text-xs font-bold text-white flex items-center justify-between sticky top-0 z-50">
          <span className="flex items-center gap-1.5">
            <span>👁️ Simulando aluno: <strong>{currentUser.name}</strong></span>
          </span>
          <button
            onClick={onExitSimulation}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Personal</span>
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 pt-safe pb-2">
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
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded-full border border-indigo-500/30">
                  ALUNO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">
                {currentUser.name} {currentUser.instructorName ? `• Personal: ${currentUser.instructorName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
