import React, { useEffect, useState, useRef } from 'react';
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

  // Timestamp de término real para contar mesmo com tela bloqueada ou app minimizado
  const endTimeRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const hasAlertedRef = useRef<boolean>(false);

  // Som suave de alarme ao finalizar o descanso
  const playFinishedChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota Lá (A5)
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // Nota Ré (D6)
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
  };

  const triggerCompletionAlert = () => {
    if (hasAlertedRef.current) return;
    hasAlertedRef.current = true;

    // Vibração no celular
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (e) {
        // ignore
      }
    }

    // Beep sonoro
    playFinishedChime();
  };

  // Inicializa quando o modal abre ou initialSeconds muda
  useEffect(() => {
    if (isOpen) {
      const targetTime = Date.now() + initialSeconds * 1000;
      endTimeRef.current = targetTime;
      hasAlertedRef.current = false;
      setTimeLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsRunning(true);
      setIsMinimized(false);
    }
  }, [isOpen, initialSeconds]);

  // Loop de atualização baseado em relógio real (Date.now())
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const checkTime = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        triggerCompletionAlert();
      }
    };

    // Executa imediatamente e a cada 500ms
    checkTime();
    const interval = setInterval(checkTime, 500);

    // Eventos de retorno ao app (quando o iPhone é desbloqueado ou usuário volta da tela de bloqueio)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkTime);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkTime);
    };
  }, [isOpen, isRunning]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));

  const addTime = (secs: number) => {
    const newEnd = Math.max(Date.now(), endTimeRef.current) + secs * 1000;
    endTimeRef.current = newEnd;
    hasAlertedRef.current = false;
    const remaining = Math.max(0, Math.ceil((newEnd - Date.now()) / 1000));
    setTimeLeft(remaining);
    setTotalTime((prev) => prev + secs);
    setIsRunning(true);
  };

  const restartTimer = (secs: number) => {
    endTimeRef.current = Date.now() + secs * 1000;
    hasAlertedRef.current = false;
    setTimeLeft(secs);
    setTotalTime(secs);
    setIsRunning(true);
  };

  // Versão minimizada (barra compacta que quase não ocupa espaço)
  if (isMinimized) {
    return (
      <div
        className="fixed left-4 right-4 z-50 max-w-md mx-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 128px)' }}
      >
        <div className="bg-zinc-900/95 border border-indigo-500/50 shadow-2xl shadow-indigo-950/80 rounded-2xl px-3.5 py-2 backdrop-blur-xl flex items-center justify-between animate-in fade-in duration-200">
          <div
            onClick={() => setIsMinimized(false)}
            className="flex items-center space-x-2 cursor-pointer select-none"
          >
            <Timer className={`w-4 h-4 ${timeLeft > 0 ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className={`font-mono text-base font-bold ${timeLeft === 0 ? 'text-emerald-400' : 'text-white'}`}>
              {timeLeft === 0 ? '0:00 - Pronto!' : `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`}
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
    <div
      className="fixed left-4 right-4 z-50 max-w-md mx-auto"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 128px)' }}
    >
      <div className="bg-zinc-900/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/90 rounded-2xl p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Timer className={`w-4 h-4 ${timeLeft > 0 ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              {timeLeft === 0 ? 'Tempo Esgotado!' : 'Descanso entre séries'}
            </span>
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
          <span className={`text-3xl font-extrabold tracking-tight font-mono ${timeLeft === 0 ? 'text-emerald-400 animate-bounce' : 'text-white'}`}>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            {timeLeft === 0 ? 'pronto para a próxima série!' : 'restantes'}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden my-2.5">
          <div
            className={`h-full transition-all duration-500 ${
              timeLeft === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
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
