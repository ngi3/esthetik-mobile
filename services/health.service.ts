import api from './api';

export type HealthStatus = {
  ok: boolean;
  status: 'ok' | 'degraded' | 'down' | string;
  uptime: number;
  timestamp: string;
  db?: 'up' | 'down' | string;
};

export async function pingHealth(): Promise<HealthStatus | null> {
  try {
    const res = await api.get('/health');
    return res.data as HealthStatus;
  } catch {
    return null;
  }
}
