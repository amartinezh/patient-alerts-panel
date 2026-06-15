import { useState } from 'react';
import { AlertCard } from './AlertCard';
import { AlertForm } from './AlertForm';
import type { AlertInput, PatientAlert } from './types';
import { useAlerts } from './useAlerts';

interface PatientAlertsPanelProps {
  patientId: string;
}

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; alert: PatientAlert };

export function PatientAlertsPanel({ patientId }: PatientAlertsPanelProps) {
  const { alerts, loading, loadError, reload, create, update, remove } =
    useAlerts(patientId);
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(input: AlertInput) {
    // Los errores suben al AlertForm, que los muestra junto al boton Guardar.
    if (formMode.kind === 'edit') {
      await update(formMode.alert.id, input);
    } else {
      await create(input);
    }
    setFormMode({ kind: 'closed' });
  }

  async function handleToggleActive(alert: PatientAlert) {
    setBusy(true);
    setActionError(null);
    try {
      await update(alert.id, { isActive: !alert.isActive });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Error al guardar la alerta',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(alert: PatientAlert) {
    if (!window.confirm(`¿Eliminar la alerta "${alert.message}"?`)) return;
    setBusy(true);
    setActionError(null);
    try {
      await remove(alert.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Error al eliminar la alerta',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="alerts-panel" aria-labelledby="alerts-title">
      <header className="alerts-panel__header">
        <h2 id="alerts-title">Alertas clínicas</h2>
        {formMode.kind === 'closed' && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setFormMode({ kind: 'create' })}
          >
            + Nueva alerta
          </button>
        )}
      </header>

      {formMode.kind !== 'closed' && (
        <AlertForm
          key={formMode.kind === 'edit' ? formMode.alert.id : 'create'}
          initial={formMode.kind === 'edit' ? formMode.alert : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormMode({ kind: 'closed' })}
        />
      )}

      {actionError && (
        <p className="alerts-panel__error" role="alert">
          {actionError}
        </p>
      )}

      {loading && <p className="alerts-panel__state">Cargando alertas…</p>}

      {!loading && loadError && (
        <div className="alerts-panel__state alerts-panel__state--error">
          <p role="alert">No se pudieron cargar las alertas: {loadError}</p>
          <button type="button" className="btn btn--ghost" onClick={() => void reload()}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !loadError && alerts.length === 0 && (
        <p className="alerts-panel__state">
          Este paciente no tiene alertas registradas.
        </p>
      )}

      {!loading && !loadError && alerts.length > 0 && (
        <div className="alerts-panel__list">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              busy={busy}
              onEdit={(a) => setFormMode({ kind: 'edit', alert: a })}
              onToggleActive={(a) => void handleToggleActive(a)}
              onDelete={(a) => void handleDelete(a)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
