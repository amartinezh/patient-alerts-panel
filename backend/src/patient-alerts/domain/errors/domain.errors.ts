export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DuplicateActiveAlertError extends DomainError {
  constructor() {
    super('Ya existe una alerta activa identica para este paciente');
  }
}

export class AlertNotFoundError extends DomainError {
  constructor(alertId: string) {
    super(`No existe la alerta ${alertId}`);
  }
}

export class PatientNotFoundError extends DomainError {
  constructor(patientId: string) {
    super(`No existe el paciente ${patientId}`);
  }
}

export class InvalidAlertDataError extends DomainError {}
