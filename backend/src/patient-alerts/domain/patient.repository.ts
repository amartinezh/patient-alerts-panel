/**
 * Puerto minimo sobre pacientes: solo lo que la feature de alertas necesita.
 */
export abstract class PatientRepository {
  abstract exists(patientId: string): Promise<boolean>;
}
