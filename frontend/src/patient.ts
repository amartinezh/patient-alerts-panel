/**
 * Paciente mock de la ficha. El id coincide con el paciente creado por
 * el seed del backend (prisma/seed.ts) para que el panel consuma datos reales.
 */
export const MOCK_PATIENT = {
  id: 'c9b1f6e2-4a3d-4e8b-9f21-7d5a8c3b1e40',
  name: 'Ana Torres',
  dni: '12345678',
  age: 34,
  site: 'Sede Miraflores',
} as const;
