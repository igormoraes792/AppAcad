import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { WorkoutLog, WeightEntry } from '../types';

interface EvolutionScreenProps {
  logs: WorkoutLog[];
  weights: WeightEntry[];
}

export const EvolutionScreen: React.FC<EvolutionScreenProps> = ({ logs, weights }) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('Supino Reto com Barra');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(logs[0]?.id || null);

  // Ordena pesos em ordem cronológica (mais antigo primeiro) para o gráfico
  const chronologicalWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));

  // Coleta lista única de todos os exercícios já registrados nos treinos
  const allRecordedExercises = Array.from(
    new Set(
      logs.flatMap((log) => log.completedExercises.map((e) => e.exerciseName))
    )
  );

  // Evolução de carga do exercício selecionado
  const exerciseHistory = logs
    .filter((log) => log.completedExercises.some((e) => e.exerciseName === selectedExercise))
    .map((log) => {
      const ex = log.completedExercises.find((e) => e.exerciseName === selectedExercise);
      const maxWeight = ex ? Math.max(...ex.sets.map((s) => s.weightKg), 0) : 0;
      const totalReps = ex ? ex.sets.reduce((sum, s) => sum + s.reps, 0) : 0;
      return {
        date: log.date,
        maxWeight,
        totalReps,
        setsCount: ex?.sets.length || 0,
        sets: ex?.sets || [],
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Cálculo de ganho de carga
  const firstLoad = exerciseHistory[0]?.maxWeight || 0;
  const latestLoad = exerciseHistory[exerciseHistory.length - 1]?.maxWeight || 0;
  const loadDiff = latestLoad - firstLoad;

  // Render do gráfico de peso SVG
  const renderWeightChart = () => {
    if (chronologicalWeights.length < 2) {
      return (
        <div className="h-44 flex items-center justify-center text-xs text-zinc-500">
          Adicione ao menos 2 registros de peso para visualizar o gráfico.
        </div>
      );
    }

    const minWeight = Math.min(...chronologicalWeights.map((w) => w.weightKg)) - 1;
    const maxWeight = Math.max(...chronologicalWeights.map((w) => w.weightKg)) + 1;
    const range = maxWeight - minWeight || 1;

    const width = 320;
    const height = 140;
    const paddingX = 24;
    const paddingY = 20;

    const points = chronologicalWeights.map((w, index) => {
      const x =
        paddingX +
        (index / (chronologicalWeights.length - 1)) * (width - paddingX * 2);
      const y =
        height -
        paddingY -
        ((w.weightKg - minWeight) / range) * (height - paddingY * 2);
      return { x, y, weight: w.weightKg, date: w.date };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          {/* Área sombreada */}
          <path d={areaD} fill="url(#weightGrad)" />

          {/* Linha principal */}
          <path
            d={pathD}
            fill="none"
            stroke="#818cf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos nos dados */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="5" fill="#09090b" stroke="#818cf8" strokeWidth="2.5" />
              <text
                x={pt.x}
                y={pt.y - 9}
                textAnchor="middle"
                className="text-[9px] fill-zinc-300 font-bold"
              >
                {pt.weight.toFixed(1)}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex justify-between text-[10px] text-zinc-500 px-2 mt-1">
          <span>{chronologicalWeights[0].date}</span>
          <span>{chronologicalWeights[chronologicalWeights.length - 1].date}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 pb-28">
      <div>
        <h2 className="text-xl font-black text-white">Histórico de Evolução</h2>
        <p className="text-xs text-zinc-400">Progresso de peso corporal, cargas e treinos</p>
      </div>

      {/* 1. GRÁFICO DE PESO CORPORAL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Evolução do Peso Corporal</h3>
              <p className="text-[10px] text-zinc-400">Curva de peso ao longo do tempo</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-400">
            {chronologicalWeights[chronologicalWeights.length - 1]?.weightKg.toFixed(1)} kg atual
          </span>
        </div>

        {renderWeightChart()}
      </div>

      {/* 2. EVOLUÇÃO DE CARGA POR EXERCÍCIO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Evolução de Cargas</h3>
              <p className="text-[10px] text-zinc-400">Aumento de força por exercício</p>
            </div>
          </div>

          {loadDiff !== 0 && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                loadDiff > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {loadDiff > 0 ? `+${loadDiff} kg (+${((loadDiff / firstLoad) * 100).toFixed(0)}%)` : `${loadDiff} kg`}
            </span>
          )}
        </div>

        {/* Seletor de Exercício */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
            Selecione o Exercício:
          </label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500"
          >
            {allRecordedExercises.length > 0 ? (
              allRecordedExercises.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))
            ) : (
              <option value="Supino Reto com Barra">Supino Reto com Barra</option>
            )}
          </select>
        </div>

        {/* Histórico do Exercício Selecionado */}
        {exerciseHistory.length === 0 ? (
          <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl">
            Nenhum treino registrado com este exercício ainda.
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {exerciseHistory.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-300">{item.date}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {item.setsCount} séries • {item.totalReps} repetições totais
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-indigo-400">
                    {item.maxWeight} kg
                  </div>
                  <span className="text-[10px] text-zinc-400">carga máxima</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. HISTÓRICO COMPLETO DE TREINOS CONCLUÍDOS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Treinos Concluídos no Mês ({logs.length})
        </h3>

        {logs.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500">
            Nenhum treino concluído ainda. Inicie um treino na aba "Hoje"!
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const totalSets = log.completedExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

              return (
                <div
                  key={log.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 select-none"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{log.workoutName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {log.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {log.durationMinutes} min
                        </span>
                        <span>•</span>
                        <span>{log.completedExercises.length} exercícios</span>
                        <span>•</span>
                        <span>{totalSets} séries</span>
                      </div>
                    </div>

                    <div className="text-zinc-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Detalhes dos exercícios realizados */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 bg-zinc-950/50 border-t border-zinc-800/60 space-y-2 animate-in fade-in duration-150">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Exercícios Executados
                      </span>

                      <div className="space-y-1.5">
                        {log.completedExercises.map((ex, i) => (
                          <div
                            key={i}
                            className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-white">{ex.exerciseName}</span>
                              <div className="text-[11px] text-zinc-400">
                                {ex.sets.map((s) => `${s.weightKg}kg x ${s.reps}`).join(' | ')}
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                              {ex.sets.length} séries
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
