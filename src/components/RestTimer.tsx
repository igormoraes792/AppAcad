import React, { useEffect, useState } from 'react';
import { Timer, X, Plus, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds = 60, isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalTime, setTotalTime] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsRunning(true);
      setIsMinimized(false);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen || !isRunning) return;

    if (timeLeft <= 0) {
      // Vibra o celular se disponível
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 300]);
        } catch (e) {
          // ignore
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));

  const addTime = (secs: number) => {
    setTimeLeft((prev) => prev + secs);
    setTotalTime((prev) => prev + secs);
  };

  const restartTimer = (secs: number) => {
    setTimeLeft(secs);
    setTotalTime(secs);
    setIsRunning(true);
  };

  // Versão minimizada (barra compacta que quase não ocupa espaço)
  if (isMinimized) {
    return (
      <div className="fixed bottom-[124px] left-4 right-4 z-30 max-w-md mx-auto">
        <div className="bg-zinc-900/95 border border-indigo-500/50 shadow-2xl shadow-indigo-950/80 rounded-2xl px-3.5 py-2 backdrop-blur-xl flex items-center justify-between animate-in fade-in duration-200">
          <div
            onClick={() => setIsMinimized(false)}
            className="flex items-center space-x-2 cursor-pointer select-none"
          >
            <Timer className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="font-mono text-base font-bold text-white">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
            <span className="text-[11px] text-indigo-300 font-medium">descansando</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => addTime(15)}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg"
            >
              +15s
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              title="Expandir timer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              title="Fechar timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Versão completa expandida
  return (
    <div className="fixed bottom-[124px] left-4 right-4 z-30 max-w-md mx-auto">
      <div className="bg-zinc-900/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/90 rounded-2xl p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Descanso entre séries</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
              title="Minimizar timer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
              title="Fechar timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display tempo */}
        <div className="flex items-baseline justify-center space-x-1 py-1">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-white">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          <span className="text-xs text-zinc-400 font-medium">restantes</span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden my-2.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Botões rápidos */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <button
            onClick={() => addTime(15)}
            className="flex-1 py-1.5 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>15s</span>
          </button>
          <button
            onClick={() => restartTimer(60)}
            className="flex-1 py-1.5 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-0.5"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>60s</span>
          </button>
          <button
            onClick={() => restartTimer(90)}
            className="flex-1 py-1.5 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-0.5"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>90s</span>
          </button>
          <button
            onClick={() => restartTimer(120)}
            className="flex-1 py-1.5 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-0.5"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>2min</span>
          </button>
        </div>
      </div>
    </div>
  );
};
