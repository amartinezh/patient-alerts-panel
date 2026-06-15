import { AlertType } from './alert-type';
import { PatientAlert } from './patient-alert.entity';

/**
 * Puerto del repositorio de alertas. La capa de aplicacion depende de esta
 * abstraccion; la implementacion concreta (Prisma) vive en infraestructura.
 */
export abstract class PatientAlertRepository {
  abstract findByPatientId(patientId: string): Promise<PatientAlert[]>;

  abstract findById(alertId: string): Promise<PatientAlert | null>;

  /**
   * Busca una alerta ACTIVA del mismo paciente con el mismo tipo y mensaje
   * (comparacion sin distincion de mayusculas). `excludeAlertId` permite
   * excluir la propia alerta cuando se valida una edicion.
   */
  abstract findActiveDuplicate(
    patientId: string,
    type: AlertType,
    message: string,
    excludeAlertId?: string,
  ): Promise<PatientAlert | null>;

  /** Crea o actualiza (upsert por id). */
  abstract save(alert: PatientAlert): Promise<void>;

  abstract delete(alertId: string): Promise<void>;
}
