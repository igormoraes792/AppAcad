import React from 'react';
import { Dumbbell, Cloud, CloudOff, Settings } from 'lucide-react';
import { getStoredSupabaseConfig } from '../lib/supabase';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const isCloudConnected = Boolean(getStoredSupabaseConfig());

  // Data formatada estilo iOS: "Sábado, 17 de Outubro"
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 pt-safe pb-2">
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              FitTrack
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">{capitalizedDate}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status do Supabase na Nuvem */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isCloudConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800/90 text-zinc-400 border-zinc-700/80'
            }`}
            title={isCloudConnected ? 'Conectado ao Supabase na nuvem' : 'Armazenamento local (toque para conectar banco online)'}
          >
            {isCloudConnected ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">Nuvem Ativa</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] hidden sm:inline">Local</span>
              </>
            )}
            <Settings className="w-3 h-3 ml-0.5 opacity-60" />
          </button>
        </div>
      </div>
    </header>
  );
};

