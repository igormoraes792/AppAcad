import React, { useState } from 'react';
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import type { WeightEntry } from '../types';
import {
  saveStoredWeights,
  getStoredWeights,
  uploadWeightToCloud,
} from '../lib/storage';

interface WeightScreenProps {
  weights: WeightEntry[];
  onWeightsUpdated: () => void;
}

export const WeightScreen: React.FC<WeightScreenProps> = ({ weights, onWeightsUpdated }) => {
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ordena por data (mais recente primeiro para a lista)
  const sortedWeights = [...weights].sort((a, b) => b.date.localeCompare(a.date));

  // Peso mais recente e primeiro peso
  const latestWeight = sortedWeights[0]?.weightKg || 0;
  const initialWeight = sortedWeights[sortedWeights.length - 1]?.weightKg || latestWeight;
  const totalDiff = Number((latestWeight - initialWeight).toFixed(1));

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    setIsSubmitting(true);

    const newEntry: WeightEntry = {
      id: `w-${Date.now()}`,
      date: newDate,
      weightKg: weightNum,
      note: newNote.trim() || undefined,
    };

    const current = getStoredWeights();
    // Se já tiver peso na mesma data, atualiza ou adiciona
    const filtered = current.filter((w) => w.date !== newDate);
    const updated = [...filtered, newEntry];
    saveStoredWeights(updated);
    await uploadWeightToCloud(newEntry);

    onWeightsUpdated();
    setNewWeight('');
    setNewNote('');
    setIsSubmitting(false);
  };

  const handleDeleteWeight = (id: string) => {
    if (confirm('Deseja excluir este registro de peso?')) {
      const current = getStoredWeights();
      const updated = current.filter((w) => w.id !== id);
      saveStoredWeights(updated);
      onWeightsUpdated();
    }
  };

  return (
    <div className="p-4 space-y-5 pb-28">
      {/* Header da Tela */}
      <div>
        <h2 className="text-xl font-black text-white">Controle de Peso</h2>
        <p className="text-xs text-zinc-400">Acompanhe sua pesagem corporal ao longo do tempo</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card Peso Atual */}
        <div className="bg-gradient-to-br from-indigo-950/70 to-zinc-900 border border-indigo-500/20 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Peso Atual</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {latestWeight.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-zinc-400">kg</span>
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1">
            {sortedWeights[0] ? `Registrado em ${sortedWeights[0].date}` : 'Sem registros'}
          </span>
        </div>

        {/* Card Variação Total */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center space-x-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
            {totalDiff <= 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            )}
            <span>Variação Total</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                totalDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
            </span>
            <span className="text-sm font-semibold text-zinc-400">kg</span>
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1">
            desde o 1º registro ({initialWeight.toFixed(1)} kg)
          </span>
        </div>
      </div>

      {/* Formulário Novo Registro de Peso */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-400" />
          Registrar Peso de Hoje
        </h3>

        <form onSubmit={handleAddWeight} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Ex: 79.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-bold placeholder-zinc-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Data</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-medium outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nota (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Pela manhã, em jejum"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            Salvar Pesagem
          </button>
        </form>
      </div>

      {/* Histórico Recente de Pesagens */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Histórico de Pesagens
        </h3>

        {sortedWeights.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500">
            Nenhum peso cadastrado.
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedWeights.map((w, index) => {
              // Compara com o peso anterior na timeline
              const previousEntry = sortedWeights[index + 1];
              const diffFromPrev = previousEntry
                ? Number((w.weightKg - previousEntry.weightKg).toFixed(1))
                : null;

              return (
                <div
                  key={w.id}
                  className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{w.weightKg.toFixed(1)} kg</span>
                        {diffFromPrev !== null && diffFromPrev !== 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              diffFromPrev < 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {diffFromPrev > 0 ? `+${diffFromPrev}` : diffFromPrev} kg
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {w.date} {w.note ? `• ${w.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteWeight(w.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
