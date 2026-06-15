import type { AlertInput, PatientAlert } from './types';

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join('. ')
          : body.message;
      }
    } catch {
      // cuerpo no-JSON: se conserva el mensaje generico
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function listAlerts(patientId: string): Promise<PatientAlert[]> {
  const res = await fetch(`${API_URL}/patients/${patientId}/alerts`);
  return handle<PatientAlert[]>(res);
}

export async function createAlert(
  patientId: string,
  input: AlertInput,
): Promise<PatientAlert> {
  const res = await fetch(`${API_URL}/patients/${patientId}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handle<PatientAlert>(res);
}

export async function updateAlert(
  alertId: string,
  changes: Partial<AlertInput>,
): Promise<PatientAlert> {
  const res = await fetch(`${API_URL}/patient-alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  return handle<PatientAlert>(res);
}

export async function deleteAlert(alertId: string): Promise<void> {
  const res = await fetch(`${API_URL}/patient-alerts/${alertId}`, {
    method: 'DELETE',
  });
  return handle<void>(res);
}
