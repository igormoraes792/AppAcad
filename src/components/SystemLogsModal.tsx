import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  getSystemLogs,
  clearSystemLogs,
  exportSystemLogsText,
  type SystemLogEntry,
  type LogLevel,
} from '../lib/logger';

interface SystemLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemLogsModal: React.FC<SystemLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('todos');
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const reloadLogs = () => {
    setLogs(getSystemLogs());
  };

  useEffect(() => {
    if (isOpen) {
      reloadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLogs = () => {
    const text = exportSystemLogsText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Deseja realmente limpar todos os logs do sistema?')) {
      clearSystemLogs();
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (filterLevel === 'todos') return true;
    return l.level === filterLevel;
  });

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            ERRO
          </span>
        );
      case 'warn':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            AVISO
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SUCESSO
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
            <Info className="w-3 h-3 text-indigo-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 pb-safe shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Histórico de Logs do Sistema</h3>
              <p className="text-[11px] text-zinc-400">Rastreamento de erros, convites e sincronia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros e Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 flex-shrink-0 border-b border-zinc-800/60">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {['todos', 'error', 'warn', 'success', 'info'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                  filterLevel === lvl
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lvl === 'todos' ? 'Todos' : lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={reloadLogs}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              title="Atualizar Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopyLogs}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
              title="Copiar relatório completo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400"
              title="Limpar logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 min-h-[260px] font-mono">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Nenhum log registrado para este filtro.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`border rounded-xl p-2.5 text-xs transition cursor-pointer ${
                    log.level === 'error'
                      ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700'
                      : log.level === 'warn'
                      ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700'
                      : log.level === 'success'
                      ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {getLevelBadge(log.level)}
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded">
                        {log.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{log.formattedTime}</span>
                  </div>

                  <p className="text-xs text-zinc-200 break-words font-sans">{log.message}</p>

                  {log.details && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/60">
                      <p className="text-[10px] text-zinc-400 font-bold mb-1">
                        {isExpanded ? '▼ Detalhes técnicos:' : '▶ Clique para ver detalhes técnicos'}
                      </p>
                      {isExpanded && (
                        <pre className="text-[10px] bg-black/60 p-2 rounded-lg overflow-x-auto text-zinc-300 whitespace-pre-wrap">
                          {log.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
