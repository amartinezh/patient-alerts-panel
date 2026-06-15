import { Injectable } from '@nestjs/common';
import { AlertSeverity } from '../domain/alert-severity';
import { AlertType } from '../domain/alert-type';
import {
  AlertNotFoundError,
  DuplicateActiveAlertError,
} from '../domain/errors/domain.errors';
import { PatientAlert } from '../domain/patient-alert.entity';
import { PatientAlertRepository } from '../domain/patient-alert.repository';

export interface UpdatePatientAlertCommand {
  type?: AlertType;
  severity?: AlertSeverity;
  message?: string;
  isActive?: boolean;
}

@Injectable()
export class UpdatePatientAlertUseCase {
  constructor(private readonly alerts: PatientAlertRepository) {}

  async execute(
    alertId: string,
    command: UpdatePatientAlertCommand,
  ): Promise<PatientAlert> {
    const alert = await this.alerts.findById(alertId);
    if (!alert) throw new AlertNotFoundError(alertId);

    alert.update(command);

    // Editar o reactivar tambien puede producir un duplicado activo:
    // se re-valida la unicidad excluyendo la propia alerta.
    if (alert.isActive) {
      const duplicate = await this.alerts.findActiveDuplicate(
        alert.patientId,
        alert.type,
        alert.message,
        alert.id,
      );
      if (duplicate) throw new DuplicateActiveAlertError();
    }

    await this.alerts.save(alert);
    return alert;
  }
}
