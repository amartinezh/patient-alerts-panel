import { PatientAlert } from '../domain/patient-alert.entity';

export interface PatientAlertResponse {
  id: string;
  patientId: string;
  type: string;
  severity: string;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPatientAlertResponse(
  alert: PatientAlert,
): PatientAlertResponse {
  return {
    id: alert.id,
    patientId: alert.patientId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    isActive: alert.isActive,
    createdAt: alert.createdAt.toISOString(),
    updatedAt: alert.updatedAt.toISOString(),
  };
}
