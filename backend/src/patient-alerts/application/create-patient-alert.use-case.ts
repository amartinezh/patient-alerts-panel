import { Injectable } from '@nestjs/common';
import { AlertSeverity } from '../domain/alert-severity';
import { AlertType } from '../domain/alert-type';
import {
  DuplicateActiveAlertError,
  PatientNotFoundError,
} from '../domain/errors/domain.errors';
import { PatientAlert } from '../domain/patient-alert.entity';
import { PatientAlertRepository } from '../domain/patient-alert.repository';
import { PatientRepository } from '../domain/patient.repository';

export interface CreatePatientAlertCommand {
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isActive?: boolean;
}

@Injectable()
export class CreatePatientAlertUseCase {
  constructor(
    private readonly alerts: PatientAlertRepository,
    private readonly patients: PatientRepository,
  ) {}

  async execute(command: CreatePatientAlertCommand): Promise<PatientAlert> {
    if (!(await this.patients.exists(command.patientId))) {
      throw new PatientNotFoundError(command.patientId);
    }

    const alert = PatientAlert.create(command);

    // Regla clave: no puede existir mas de una alerta activa identica
    // (mismo paciente + tipo + mensaje) para el mismo paciente.
    if (alert.isActive) {
      const duplicate = await this.alerts.findActiveDuplicate(
        alert.patientId,
        alert.type,
        alert.message,
      );
      if (duplicate) throw new DuplicateActiveAlertError();
    }

    await this.alerts.save(alert);
    return alert;
  }
}
