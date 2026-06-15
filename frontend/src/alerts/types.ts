export const ALERT_TYPES = [
  'ALLERGY',
  'MEDICAL_RISK',
  'SPECIAL_CONDITION',
  'ADMINISTRATIVE',
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export interface PatientAlert {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertInput {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isActive: boolean;
}

export const TYPE_LABELS: Record<AlertType, string> = {
  ALLERGY: 'Alergia',
  MEDICAL_RISK: 'Riesgo médico',
  SPECIAL_CONDITION: 'Condición especial',
  ADMINISTRATIVE: 'Administrativa',
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  HIGH: 'HIGH',
  MEDIUM: 'MED',
  LOW: 'LOW',
};
