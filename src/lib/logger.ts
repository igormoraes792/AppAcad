export type LogLevel = 'info' | 'success' | 'warn' | 'error';
export type LogCategory = 'AUTH' | 'CONVITE' | 'SENHA' | 'SINCRONIA' | 'TREINO' | 'SISTEMA';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  formattedTime: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: string;
}

const LOGS_STORAGE_KEY = 'fittrack_system_logs';
const MAX_LOGS = 120;

function formatLogDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${d}/${m} ${h}:${min}:${s}`;
}

export function getSystemLogs(): SystemLogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler logs do sistema:', e);
  }
  return [];
}

export function addSystemLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  detailsObj?: any
): SystemLogEntry {
  const now = new Date();
  let details: string | undefined;

  if (detailsObj !== undefined && detailsObj !== null) {
    try {
      details = typeof detailsObj === 'string' ? detailsObj : JSON.stringify(detailsObj, null, 2);
    } catch {
      details = String(detailsObj);
    }
  }

  const entry: SystemLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: now.toISOString(),
    formattedTime: formatLogDate(now),
    level,
    category,
    message,
    details,
  };

  // Console output
  const prefix = `[FitTrack][${category}][${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(prefix, message, detailsObj || '');
  } else if (level === 'warn') {
    console.warn(prefix, message, detailsObj || '');
  } else {
    console.log(prefix, message, detailsObj || '');
  }

  try {
    const currentLogs = getSystemLogs();
    const updated = [entry, ...currentLogs].slice(0, MAX_LOGS);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Falha ao gravar log no localStorage:', e);
  }

  return entry;
}

export function clearSystemLogs(): void {
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  } catch (e) {
    console.error('Falha ao limpar logs:', e);
  }
}

export function exportSystemLogsText(): string {
  const logs = getSystemLogs();
  if (logs.length === 0) return 'Nenhum log registrado ainda.';

  return logs
    .map(
      (l) =>
        `[${l.formattedTime}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}${
          l.details ? `\nDetalhes:\n${l.details}` : ''
        }`
    )
    .join('\n----------------------------------------\n');
}

