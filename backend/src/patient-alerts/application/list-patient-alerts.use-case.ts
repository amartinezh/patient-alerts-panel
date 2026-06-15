import { Injectable } from '@nestjs/common';
import { severityRank } from '../domain/alert-severity';
import { PatientAlert } from '../domain/patient-alert.entity';
import { PatientAlertRepository } from '../domain/patient-alert.repository';

@Injectable()
export class ListPatientAlertsUseCase {
  constructor(private readonly alerts: PatientAlertRepository) {}

  /**
   * Orden de presentacion definido por negocio: activas primero,
   * luego severidad (HIGH > MEDIUM > LOW), luego mas recientes.
   */
  async execute(patientId: string): Promise<PatientAlert[]> {
    const alerts = await this.alerts.findByPatientId(patientId);
    return [...alerts].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      const bySeverity = severityRank(b.severity) - severityRank(a.severity);
      if (bySeverity !== 0) return bySeverity;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
}
