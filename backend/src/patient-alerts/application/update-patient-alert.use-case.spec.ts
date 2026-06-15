import { AlertSeverity } from '../domain/alert-severity';
import { AlertType } from '../domain/alert-type';
import {
  AlertNotFoundError,
  DuplicateActiveAlertError,
} from '../domain/errors/domain.errors';
import { PatientAlert } from '../domain/patient-alert.entity';
import { InMemoryPatientAlertRepository } from '../testing/in-memory.repositories';
import { UpdatePatientAlertUseCase } from './update-patient-alert.use-case';

const PATIENT_ID = 'patient-1';

function buildAlert(overrides: Partial<{ message: string; isActive: boolean }> = {}) {
  return PatientAlert.create({
    patientId: PATIENT_ID,
    type: AlertType.ALLERGY,
    severity: AlertSeverity.HIGH,
    message: overrides.message ?? 'Alergia a penicilina',
    isActive: overrides.isActive ?? true,
  });
}

describe('UpdatePatientAlertUseCase', () => {
  let alerts: InMemoryPatientAlertRepository;
  let useCase: UpdatePatientAlertUseCase;

  beforeEach(() => {
    alerts = new InMemoryPatientAlertRepository();
    useCase = new UpdatePatientAlertUseCase(alerts);
  });

  it('permite editar mensaje y severidad', async () => {
    const alert = buildAlert();
    await alerts.save(alert);

    const updated = await useCase.execute(alert.id, {
      message: 'Alergia a penicilina y derivados',
      severity: AlertSeverity.MEDIUM,
    });

    expect(updated.message).toBe('Alergia a penicilina y derivados');
    expect(updated.severity).toBe(AlertSeverity.MEDIUM);
  });

  it('permite desactivar y reactivar una alerta', async () => {
    const alert = buildAlert();
    await alerts.save(alert);

    const deactivated = await useCase.execute(alert.id, { isActive: false });
    expect(deactivated.isActive).toBe(false);

    const reactivated = await useCase.execute(alert.id, { isActive: true });
    expect(reactivated.isActive).toBe(true);
  });

  it('rechaza reactivar si genera un duplicado activo', async () => {
    const inactive = buildAlert({ isActive: false });
    const active = buildAlert();
    await alerts.save(inactive);
    await alerts.save(active);

    await expect(
      useCase.execute(inactive.id, { isActive: true }),
    ).rejects.toBeInstanceOf(DuplicateActiveAlertError);
  });

  it('rechaza editar un mensaje hacia un duplicado activo', async () => {
    const first = buildAlert();
    const second = buildAlert({ message: 'Otra advertencia' });
    await alerts.save(first);
    await alerts.save(second);

    await expect(
      useCase.execute(second.id, { message: 'Alergia a penicilina' }),
    ).rejects.toBeInstanceOf(DuplicateActiveAlertError);
  });

  it('no se marca a si misma como duplicado al editar', async () => {
    const alert = buildAlert();
    await alerts.save(alert);

    await expect(
      useCase.execute(alert.id, { severity: AlertSeverity.LOW }),
    ).resolves.toBeDefined();
  });

  it('lanza 404 de dominio si la alerta no existe', async () => {
    await expect(
      useCase.execute('no-existe', { isActive: false }),
    ).rejects.toBeInstanceOf(AlertNotFoundError);
  });
});
