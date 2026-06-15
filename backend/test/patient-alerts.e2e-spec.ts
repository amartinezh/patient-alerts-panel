import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PatientAlertRepository } from '../src/patient-alerts/domain/patient-alert.repository';
import { PatientRepository } from '../src/patient-alerts/domain/patient.repository';
import {
  InMemoryPatientAlertRepository,
  InMemoryPatientRepository,
} from '../src/patient-alerts/testing/in-memory.repositories';
import { PrismaService } from '../src/prisma/prisma.service';

const PATIENT_ID = 'patient-e2e';

describe('Patient alerts API (e2e)', () => {
  let app: INestApplication;
  let alertsRepo: InMemoryPatientAlertRepository;

  beforeAll(async () => {
    alertsRepo = new InMemoryPatientAlertRepository();
    const patientsRepo = new InMemoryPatientRepository();
    patientsRepo.addPatient(PATIENT_ID);

    // Se sustituyen los adaptadores Prisma por repos en memoria: el test
    // cubre HTTP + validacion + casos de uso + regla de dominio, sin DB.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PatientAlertRepository)
      .useValue(alertsRepo)
      .overrideProvider(PatientRepository)
      .useValue(patientsRepo)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    alertsRepo.clear();
  });

  const validPayload = {
    type: 'ALLERGY',
    severity: 'HIGH',
    message: 'Alergia a penicilina',
  };

  it('POST /patients/:patientId/alerts crea una alerta (201)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send(validPayload)
      .expect(201);

    expect(res.body).toMatchObject({
      patientId: PATIENT_ID,
      type: 'ALLERGY',
      severity: 'HIGH',
      message: 'Alergia a penicilina',
      isActive: true,
    });
    expect(res.body.id).toBeDefined();
  });

  it('POST duplicado activo responde 409', async () => {
    await request(app.getHttpServer())
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send(validPayload)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send(validPayload)
      .expect(409);

    expect(res.body.message).toContain('alerta activa identica');
  });

  it('POST con payload invalido responde 400', async () => {
    await request(app.getHttpServer())
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send({ type: 'NO_EXISTE', severity: 'HIGH', message: '' })
      .expect(400);
  });

  it('POST para paciente inexistente responde 404', async () => {
    await request(app.getHttpServer())
      .post('/patients/desconocido/alerts')
      .send(validPayload)
      .expect(404);
  });

  it('GET lista con activas primero y ordenadas por severidad', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send({ type: 'ADMINISTRATIVE', severity: 'LOW', message: 'Copago pendiente' })
      .expect(201);
    const inactive = await request(server)
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send({ type: 'MEDICAL_RISK', severity: 'HIGH', message: 'Hipertension', isActive: false })
      .expect(201);
    await request(server)
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send(validPayload)
      .expect(201);

    const res = await request(server)
      .get(`/patients/${PATIENT_ID}/alerts`)
      .expect(200);

    expect(res.body).toHaveLength(3);
    expect(res.body[0].message).toBe('Alergia a penicilina'); // activa HIGH
    expect(res.body[1].message).toBe('Copago pendiente'); // activa LOW
    expect(res.body[2].id).toBe(inactive.body.id); // inactiva al final
  });

  it('PATCH desactiva una alerta y DELETE la elimina', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post(`/patients/${PATIENT_ID}/alerts`)
      .send(validPayload)
      .expect(201);
    const alertId = created.body.id;

    const patched = await request(server)
      .patch(`/patient-alerts/${alertId}`)
      .send({ isActive: false })
      .expect(200);
    expect(patched.body.isActive).toBe(false);

    await request(server).delete(`/patient-alerts/${alertId}`).expect(204);
    await request(server).delete(`/patient-alerts/${alertId}`).expect(404);
  });
});
