import { AlertType } from '../domain/alert-type';
import { PatientAlert } from '../domain/patient-alert.entity';
import { PatientAlertRepository } from '../domain/patient-alert.repository';
import { PatientRepository } from '../domain/patient.repository';

/**
 * Implementaciones en memoria de los puertos del dominio.
 * Permiten testear casos de uso y API sin base de datos:
 * eso es exactamente lo que valida la separacion de capas.
 */
export class InMemoryPatientAlertRepository extends PatientAlertRepository {
  private readonly alerts = new Map<string, PatientAlert>();

  async findByPatientId(patientId: string): Promise<PatientAlert[]> {
    return [...this.alerts.values()].filter((a) => a.patientId === patientId);
  }

  async findById(alertId: string): Promise<PatientAlert | null> {
    return this.alerts.get(alertId) ?? null;
  }

  async findActiveDuplicate(
    patientId: string,
    type: AlertType,
    message: string,
    excludeAlertId?: string,
  ): Promise<PatientAlert | null> {
    const normalized = message.toLowerCase();
    return (
      [...this.alerts.values()].find(
        (a) =>
          a.patientId === patientId &&
          a.isActive &&
          a.type === type &&
          a.message.toLowerCase() === normalized &&
          a.id !== excludeAlertId,
      ) ?? null
    );
  }

  async save(alert: PatientAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
  }

  async delete(alertId: string): Promise<void> {
    this.alerts.delete(alertId);
  }

  clear(): void {
    this.alerts.clear();
  }
}

export class InMemoryPatientRepository extends PatientRepository {
  private readonly patientIds = new Set<string>();

  addPatient(patientId: string): void {
    this.patientIds.add(patientId);
  }

  async exists(patientId: string): Promise<boolean> {
    return this.patientIds.has(patientId);
  }
}
