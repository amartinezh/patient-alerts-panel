import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Id fijo para que la ficha mock del frontend apunte al mismo paciente.
export const MOCK_PATIENT_ID = 'c9b1f6e2-4a3d-4e8b-9f21-7d5a8c3b1e40';

async function main() {
  await prisma.patient.upsert({
    where: { id: MOCK_PATIENT_ID },
    update: {},
    create: {
      id: MOCK_PATIENT_ID,
      name: 'Ana Torres',
      dni: '12345678',
    },
  });

  await prisma.patientAlert.upsert({
    where: { id: 'seed-alert-allergy' },
    update: {},
    create: {
      id: 'seed-alert-allergy',
      patientId: MOCK_PATIENT_ID,
      type: 'ALLERGY',
      severity: 'HIGH',
      message: 'Alergia a penicilina',
      isActive: true,
    },
  });

  await prisma.patientAlert.upsert({
    where: { id: 'seed-alert-admin' },
    update: {},
    create: {
      id: 'seed-alert-admin',
      patientId: MOCK_PATIENT_ID,
      type: 'ADMINISTRATIVE',
      severity: 'MEDIUM',
      message: 'Requiere autorizacion previa de la aseguradora',
      isActive: true,
    },
  });

  console.log('Seed completado: paciente Ana Torres con 2 alertas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
