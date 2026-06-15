import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from './api';
import { PatientAlertsPanel } from './PatientAlertsPanel';
import type { PatientAlert } from './types';

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return {
    ...actual,
    listAlerts: vi.fn(),
    createAlert: vi.fn(),
    updateAlert: vi.fn(),
    deleteAlert: vi.fn(),
  };
});

const PATIENT_ID = 'patient-test';

function buildAlert(overrides: Partial<PatientAlert>): PatientAlert {
  return {
    id: 'alert-1',
    patientId: PATIENT_ID,
    type: 'ALLERGY',
    severity: 'HIGH',
    message: 'Alergia a penicilina',
    isActive: true,
    createdAt: '2026-06-12T10:00:00.000Z',
    updatedAt: '2026-06-12T10:00:00.000Z',
    ...overrides,
  };
}

describe('PatientAlertsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra loading y luego el estado vacio', async () => {
    vi.mocked(api.listAlerts).mockResolvedValue([]);

    render(<PatientAlertsPanel patientId={PATIENT_ID} />);

    expect(screen.getByText('Cargando alertas…')).toBeInTheDocument();
    expect(
      await screen.findByText('Este paciente no tiene alertas registradas.'),
    ).toBeInTheDocument();
  });

  it('muestra las alertas con tipo, severidad, mensaje y estado', async () => {
    vi.mocked(api.listAlerts).mockResolvedValue([
      buildAlert({}),
      buildAlert({
        id: 'alert-2',
        type: 'ADMINISTRATIVE',
        severity: 'MEDIUM',
        message: 'Requiere autorizacion',
        isActive: false,
      }),
    ]);

    render(<PatientAlertsPanel patientId={PATIENT_ID} />);

    expect(await screen.findAllByTestId('alert-card')).toHaveLength(2);
    expect(screen.getByText('Alergia')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Alergia a penicilina')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Administrativa')).toBeInTheDocument();
    expect(screen.getByText('MED')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('muestra el error de carga con opcion de reintentar', async () => {
    vi.mocked(api.listAlerts).mockRejectedValue(
      new api.ApiError(500, 'Fallo interno'),
    );

    render(<PatientAlertsPanel patientId={PATIENT_ID} />);

    expect(
      await screen.findByText(/No se pudieron cargar las alertas/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
  });
});
