import { useState } from 'react';
import { PatientAlertsPanel } from './alerts/PatientAlertsPanel';
import { MOCK_PATIENT } from './patient';

const TABS = ['Datos', 'Citas', 'Alertas'] as const;
type Tab = (typeof TABS)[number];

export function PatientRecordPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Alertas');

  return (
    <main className="record">
      <header className="record__header">
        <h1>{MOCK_PATIENT.name}</h1>
        <p className="record__meta">
          DNI {MOCK_PATIENT.dni} · {MOCK_PATIENT.age} años · {MOCK_PATIENT.site}
        </p>
      </header>

      <nav className="record__tabs" aria-label="Secciones de la ficha">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`record__tab ${activeTab === tab ? 'record__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Alertas' && (
        <PatientAlertsPanel patientId={MOCK_PATIENT.id} />
      )}
      {activeTab === 'Datos' && (
        <p className="record__placeholder">
          Sección mock: datos demográficos del paciente.
        </p>
      )}
      {activeTab === 'Citas' && (
        <p className="record__placeholder">
          Sección mock: historial de citas del paciente.
        </p>
      )}
    </main>
  );
}
