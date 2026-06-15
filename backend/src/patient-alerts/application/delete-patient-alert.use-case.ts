import { Injectable } from '@nestjs/common';
import { AlertNotFoundError } from '../domain/errors/domain.errors';
import { PatientAlertRepository } from '../domain/patient-alert.repository';

@Injectable()
export class DeletePatientAlertUseCase {
  constructor(private readonly alerts: PatientAlertRepository) {}

  async execute(alertId: string): Promise<void> {
    const alert = await this.alerts.findById(alertId);
    if (!alert) throw new AlertNotFoundError(alertId);
    await this.alerts.delete(alertId);
  }
}
