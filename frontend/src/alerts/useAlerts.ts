import { useCallback, useEffect, useState } from 'react';
import { createAlert, deleteAlert, listAlerts, updateAlert } from './api';
import type { AlertInput, PatientAlert } from './types';

/**
 * Estado y operaciones del panel de alertas. La lista siempre se
 * re-consulta tras cada mutacion: el backend es la fuente de verdad
 * del orden (activas primero) y de la regla anti-duplicados.
 */
export function useAlerts(patientId: string) {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setAlerts(await listAlerts(patientId));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Error al cargar las alertas',
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (input: AlertInput) => {
      await createAlert(patientId, input);
      await load();
    },
    [patientId, load],
  );

  const update = useCallback(
    async (alertId: string, changes: Partial<AlertInput>) => {
      await updateAlert(alertId, changes);
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (alertId: string) => {
      await deleteAlert(alertId);
      await load();
    },
    [load],
  );

  return { alerts, loading, loadError, reload: load, create, update, remove };
}
