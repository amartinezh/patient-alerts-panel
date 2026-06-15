import { randomUUID } from 'crypto';
import { AlertSeverity, ALERT_SEVERITIES } from './alert-severity';
import { AlertType, ALERT_TYPES } from './alert-type';
import { InvalidAlertDataError } from './errors/domain.errors';

export interface PatientAlertProps {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientAlertInput {
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isActive?: boolean;
}

export interface UpdatePatientAlertInput {
  type?: AlertType;
  severity?: AlertSeverity;
  message?: string;
  isActive?: boolean;
}

export const MAX_MESSAGE_LENGTH = 500;

export class PatientAlert {
  private constructor(private readonly props: PatientAlertProps) {}

  /**
   * Normaliza el mensaje para que diferencias de espacios no produzcan
   * alertas "distintas" que en la practica son la misma advertencia.
   */
  static normalizeMessage(message: string): string {
    return message.trim().replace(/\s+/g, ' ');
  }

  static create(input: CreatePatientAlertInput): PatientAlert {
    const now = new Date();
    const props: PatientAlertProps = {
      id: randomUUID(),
      patientId: input.patientId,
      type: input.type,
      severity: input.severity,
      message: PatientAlert.normalizeMessage(input.message ?? ''),
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    PatientAlert.assertValid(props);
    return new PatientAlert(props);
  }

  static fromPersistence(props: PatientAlertProps): PatientAlert {
    return new PatientAlert({ ...props });
  }

  update(changes: UpdatePatientAlertInput): void {
    if (changes.type !== undefined) this.props.type = changes.type;
    if (changes.severity !== undefined) this.props.severity = changes.severity;
    if (changes.message !== undefined) {
      this.props.message = PatientAlert.normalizeMessage(changes.message);
    }
    if (changes.isActive !== undefined) this.props.isActive = changes.isActive;
    PatientAlert.assertValid(this.props);
    this.props.updatedAt = new Date();
  }

  private static assertValid(props: PatientAlertProps): void {
    if (!props.patientId) {
      throw new InvalidAlertDataError('La alerta requiere un paciente');
    }
    if (!ALERT_TYPES.includes(props.type)) {
      throw new InvalidAlertDataError(`Tipo de alerta invalido: ${props.type}`);
    }
    if (!ALERT_SEVERITIES.includes(props.severity)) {
      throw new InvalidAlertDataError(`Severidad invalida: ${props.severity}`);
    }
    if (props.message.length === 0) {
      throw new InvalidAlertDataError('El mensaje no puede estar vacio');
    }
    if (props.message.length > MAX_MESSAGE_LENGTH) {
      throw new InvalidAlertDataError(
        `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`,
      );
    }
  }

  get id(): string {
    return this.props.id;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get type(): AlertType {
    return this.props.type;
  }
  get severity(): AlertSeverity {
    return this.props.severity;
  }
  get message(): string {
    return this.props.message;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
