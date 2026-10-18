import React, { useState } from 'react';
import { X, Cloud, Key, Globe, Check, Copy, Database } from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const current = getStoredSupabaseConfig();
  const [url, setUrl] = useState(current?.url || '');
  const [anonKey, setAnonKey] = useState(current?.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      saveStoredSupabaseConfig(null);
    } else {
      saveStoredSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
      });
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onConfigUpdated();
      onClose();
    }, 700);
  };

  const handleClear = () => {
    saveStoredSupabaseConfig(null);
    setUrl('');
    setAnonKey('');
    onConfigUpdated();
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 pb-safe shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Banco na Nuvem (Supabase)</h3>
              <p className="text-xs text-zinc-400">Sem necessidade de servidor local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-300 space-y-1.5">
            <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              Como funciona o banco online gratuito:
            </p>
            <p className="text-zinc-400 leading-relaxed">
              1. Crie uma conta grátis em <strong className="text-indigo-400">supabase.com</strong>
            </p>
            <p className="text-zinc-400 leading-relaxed">
              2. Vá em <strong>Project Settings → API</strong> e copie a URL e a Anon Key abaixo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-zinc-400" />
              Project URL
            </label>
            <input
              type="url"
              placeholder="https://seu-projeto.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <Key className="w-3 h-3 text-zinc-400" />
              API Anon Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition"
            />
          </div>

          {/* Script SQL com 1 clique */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-300">Criar Tabelas no Supabase:</span>
              <button
                type="button"
                onClick={copySql}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar Script SQL'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Cole o script no menu <strong>SQL Editor</strong> do painel Supabase para criar as tabelas automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3">
            {current && (
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 text-xs font-semibold transition"
              >
                Desconectar
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Configurações Salvas!</span>
                </>
              ) : (
                <span>Salvar Conexão</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
