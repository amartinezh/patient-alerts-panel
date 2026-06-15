import type { PatientAlert } from './types';
import { SEVERITY_LABELS, TYPE_LABELS } from './types';

interface AlertCardProps {
  alert: PatientAlert;
  busy: boolean;
  onEdit: (alert: PatientAlert) => void;
  onToggleActive: (alert: PatientAlert) => void;
  onDelete: (alert: PatientAlert) => void;
}

export function AlertCard({
  alert,
  busy,
  onEdit,
  onToggleActive,
  onDelete,
}: AlertCardProps) {
  return (
    <article
      className={`alert-card ${alert.isActive ? '' : 'alert-card--inactive'}`}
      data-testid="alert-card"
    >
      <span className={`severity-badge severity-badge--${alert.severity.toLowerCase()}`}>
        {SEVERITY_LABELS[alert.severity]}
      </span>
      <div className="alert-card__body">
        <span className="alert-card__type">{TYPE_LABELS[alert.type]}</span>
        <p className="alert-card__message">{alert.message}</p>
      </div>
      <span
        className={`status-chip ${alert.isActive ? 'status-chip--active' : 'status-chip--inactive'}`}
      >
        {alert.isActive ? 'Activa' : 'Inactiva'}
      </span>
      <div className="alert-card__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => onEdit(alert)}
        >
          Editar
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => onToggleActive(alert)}
        >
          {alert.isActive ? 'Desactivar' : 'Activar'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--danger"
          disabled={busy}
          onClick={() => onDelete(alert)}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
