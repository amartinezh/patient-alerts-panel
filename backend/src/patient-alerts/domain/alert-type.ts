export enum AlertType {
  ALLERGY = 'ALLERGY',
  MEDICAL_RISK = 'MEDICAL_RISK',
  SPECIAL_CONDITION = 'SPECIAL_CONDITION',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
}

export const ALERT_TYPES: readonly AlertType[] = Object.values(AlertType);
