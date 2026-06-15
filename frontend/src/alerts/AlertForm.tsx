import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AlertInput, AlertSeverity, AlertType, PatientAlert } from './types';
import { ALERT_SEVERITIES, ALERT_TYPES, SEVERITY_LABELS, TYPE_LABELS } from './types';

interface AlertFormProps {
  /** Alerta a editar; si no se pasa, el formulario crea una nueva. */
  initial?: PatientAlert;
  onSubmit: (input: AlertInput) => Promise<void>;
  onCancel: () => void;
}

export function AlertForm({ initial, onSubmit, onCancel }: AlertFormProps) {
  const [type, setType] = useState<AlertType>(initial?.type ?? 'ALLERGY');
  const [severity, setSeverity] = useState<AlertSeverity>(
    initial?.severity ?? 'MEDIUM',
  );
  const [message, setMessage] = useState(initial?.message ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (message.trim().length === 0) {
      setError('El mensaje no puede estar vacío');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ type, severity, message: message.trim(), isActive });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar la alerta',
      );
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  return (
    <form className="alert-form" onSubmit={handleSubmit}>
      <h3 className="alert-form__title">
        {initial ? 'Editar alerta' : 'Nueva alerta'}
      </h3>
      <div className="alert-form__grid">
        <label className="field">
          <span className="field__label">Tipo</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AlertType)}
            disabled={saving}
          >
            {ALERT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Severidad</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
            disabled={saving}
          >
            {ALERT_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field field--full">
          <span className="field__label">Mensaje</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ej. Alergia a penicilina"
            disabled={saving}
            required
          />
        </label>
        <label className="field field--checkbox">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={saving}
          />
          <span>Alerta activa</span>
        </label>
      </div>
      {error && (
        <p className="alert-form__error" role="alert">
          {error}
        </p>
      )}
      <div className="alert-form__actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
