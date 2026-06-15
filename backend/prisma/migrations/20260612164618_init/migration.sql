-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dni" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PatientAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PatientAlert_patientId_isActive_idx" ON "PatientAlert"("patientId", "isActive");

-- Indice unico parcial (manual): refuerza en base de datos la regla de negocio
-- "no mas de una alerta activa identica por paciente", cubriendo condiciones de
-- carrera que el chequeo del caso de uso no alcanza a ver. Prisma no modela
-- indices parciales declarativamente, por eso vive solo en la migracion.
-- La comparacion es exacta (case-sensitive); la capa de aplicacion ademas
-- compara sin distincion de mayusculas y normaliza espacios.
CREATE UNIQUE INDEX "PatientAlert_unique_active_alert" ON "PatientAlert"("patientId", "type", "message") WHERE "isActive" = true;
