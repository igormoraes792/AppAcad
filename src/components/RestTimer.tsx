import React, { useEffect, useState } from 'react';
import { Timer, X, Plus, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds = 60, isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalTime, setTotalTime] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsRunning(true);
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

  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 max-w-md mx-auto">
      <div className="bg-zinc-900/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/80 rounded-2xl p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Descanso entre séries</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display tempo */}
        <div className="flex items-baseline justify-center space-x-1 py-1">
          <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          <span className="text-xs text-zinc-400 font-medium">restantes</span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden my-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Botões rápidos */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <button
            onClick={() => addTime(15)}
            className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>15s</span>
          </button>
          <button
            onClick={() => restartTimer(60)}
            className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>60s</span>
          </button>
          <button
            onClick={() => restartTimer(90)}
            className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>90s</span>
          </button>
          <button
            onClick={() => restartTimer(120)}
            className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>2min</span>
          </button>
        </div>
      </div>
    </div>
  );
};

