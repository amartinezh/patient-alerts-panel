import { AlertSeverity } from '../domain/alert-severity';
import { AlertType } from '../domain/alert-type';
import {
  DuplicateActiveAlertError,
  PatientNotFoundError,
} from '../domain/errors/domain.errors';
import {
  InMemoryPatientAlertRepository,
  InMemoryPatientRepository,
} from '../testing/in-memory.repositories';
import { CreatePatientAlertUseCase } from './create-patient-alert.use-case';

const PATIENT_ID = 'patient-1';

describe('CreatePatientAlertUseCase (regla anti-duplicados)', () => {
  let alerts: InMemoryPatientAlertRepository;
  let patients: InMemoryPatientRepository;
  let useCase: CreatePatientAlertUseCase;

  const baseCommand = {
    patientId: PATIENT_ID,
    type: AlertType.ALLERGY,
    severity: AlertSeverity.HIGH,
    message: 'Alergia a penicilina',
  };

  beforeEach(() => {
    alerts = new InMemoryPatientAlertRepository();
    patients = new InMemoryPatientRepository();
    patients.addPatient(PATIENT_ID);
    useCase = new CreatePatientAlertUseCase(alerts, patients);
  });

  it('crea una alerta activa valida', async () => {
    const alert = await useCase.execute(baseCommand);

    expect(alert.isActive).toBe(true);
    expect(alert.message).toBe('Alergia a penicilina');
    await expect(alerts.findById(alert.id)).resolves.not.toBeNull();
  });

  it('rechaza una alerta activa identica para el mismo paciente', async () => {
    await useCase.execute(baseCommand);

    await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
      DuplicateActiveAlertError,
    );
  });

  it('detecta duplicados aunque cambien mayusculas y espacios', async () => {
    await useCase.execute(baseCommand);

    await expect(
      useCase.execute({ ...baseCommand, message: '  alergia a   PENICILINA ' }),
    ).rejects.toBeInstanceOf(DuplicateActiveAlertError);
  });

  it('permite crear una alerta identica si la existente esta inactiva', async () => {
    const first = await useCase.execute(baseCommand);
    first.update({ isActive: false });
    await alerts.save(first);

    await expect(useCase.execute(baseCommand)).resolves.toBeDefined();
  });

  it('permite la misma alerta en pacientes distintos', async () => {
    patients.addPatient('patient-2');
    await useCase.execute(baseCommand);

    await expect(
      useCase.execute({ ...baseCommand, patientId: 'patient-2' }),
    ).resolves.toBeDefined();
  });

  it('rechaza alertas para pacientes inexistentes', async () => {
    await expect(
      useCase.execute({ ...baseCommand, patientId: 'no-existe' }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
