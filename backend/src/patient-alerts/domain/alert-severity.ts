export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export const ALERT_SEVERITIES: readonly AlertSeverity[] =
  Object.values(AlertSeverity);

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  [AlertSeverity.HIGH]: 3,
  [AlertSeverity.MEDIUM]: 2,
  [AlertSeverity.LOW]: 1,
};

export function severityRank(severity: AlertSeverity): number {
  return SEVERITY_RANK[severity];
}
