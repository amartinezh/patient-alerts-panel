# Documento de Arquitectura — PatientAlertsPanel

> Feature fullstack: **Panel de alertas clínicas en la ficha del paciente** (ClinicSay — prueba take-home).

## 1. Contexto y problema

En ClinicSay cada paciente tiene una ficha que el equipo consulta antes de atenderlo. Hoy las advertencias del paciente (alergias, riesgos médicos, condiciones especiales, avisos administrativos) están dispersas en notas o en la memoria del personal, lo que genera riesgos operativos:

- Un profesional podría no ver una alergia antes de indicar un procedimiento.
- Recepción podría no saber que el paciente requiere autorización administrativa.
- Dos usuarios podrían registrar la misma alerta varias veces.
- Una alerta antigua podría seguir activa aunque ya no aplique.

**Objetivo:** agregar un panel visible de *Alertas clínicas* dentro de la ficha del paciente, con CRUD completo y garantías de consistencia en el backend.

### Regla de negocio clave (invariante del dominio)

> **No debe existir más de una alerta activa idéntica para el mismo paciente.**

Dos alertas se consideran *idénticas* cuando coinciden `patientId + type + message` (normalizado). La regla aplica solo entre alertas **activas**: desactivar una alerta permite crear/reactivar otra igual; reactivarla vuelve a validar la unicidad. Esta regla vive en el **dominio / caso de uso**, nunca en el controlador ni delegada al frontend, y se respalda con una restricción a nivel de base de datos como defensa en profundidad.

## 2. Visión general de la solución

Monorepo simple con dos aplicaciones:

```
patient-alerts-panel/
├── docs/                  # Este documento y material de soporte
├── backend/               # API NestJS + Prisma (DDD)
└── frontend/              # Ficha mock de paciente + PatientAlertsPanel
```

```
┌────────────────────────┐         HTTP/JSON          ┌─────────────────────────────┐
│  Frontend (ficha mock) │ ─────────────────────────► │  Backend NestJS             │
│  PatientAlertsPanel    │ ◄───────────────────────── │  API → Casos de uso →       │
│  AlertCard / AlertForm │                            │  Dominio → Repositorio      │
└────────────────────────┘                            └──────────────┬──────────────┘
                                                                     │ Prisma
                                                              ┌──────▼──────┐
                                                              │   SQLite /  │
                                                              │  PostgreSQL │
                                                              └─────────────┘
```

**Decisión de base de datos:** SQLite para desarrollo y evaluación (cero setup: `npx prisma migrate dev` y listo). El esquema Prisma es compatible con PostgreSQL para producción; ningún caso de uso depende del motor.

## 3. Backend — Arquitectura DDD

### 3.1 Capas

```
backend/src/
├── patient-alerts/
│   ├── domain/                          # Núcleo: sin dependencias de Nest ni Prisma
│   │   ├── patient-alert.entity.ts      # Entidad PatientAlert + invariantes
│   │   ├── alert-type.ts                # Value object / enum: ALLERGY, MEDICAL_RISK,
│   │   │                                #   SPECIAL_CONDITION, ADMINISTRATIVE
│   │   ├── alert-severity.ts            # Value object / enum: LOW, MEDIUM, HIGH
│   │   ├── patient-alert.repository.ts  # Puerto (interfaz abstracta del repositorio)
│   │   └── errors/
│   │       ├── duplicate-active-alert.error.ts
│   │       └── alert-not-found.error.ts
│   │
│   ├── application/                     # Casos de uso: orquestan dominio + puertos
│   │   ├── list-patient-alerts.use-case.ts
│   │   ├── create-patient-alert.use-case.ts
│   │   ├── update-patient-alert.use-case.ts    # editar / activar / desactivar
│   │   └── delete-patient-alert.use-case.ts
│   │
│   ├── infrastructure/                  # Adaptadores
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma-patient-alert.repository.ts  # Implementa el puerto
│   │   └── ...
│   │
│   ├── api/                             # Capa de entrada (HTTP)
│   │   ├── patient-alerts.controller.ts # Controlador delgado: valida, delega, mapea
│   │   ├── dto/
│   │   │   ├── create-patient-alert.dto.ts
│   │   │   └── update-patient-alert.dto.ts
│   │   └── filters/domain-error.filter.ts  # Error de dominio → código HTTP
│   │
│   └── patient-alerts.module.ts         # Wiring de DI del módulo
├── app.module.ts
└── main.ts
```

**Regla de dependencias (hacia adentro):** `api → application → domain` e `infrastructure → domain`. El dominio no importa nada de Nest ni de Prisma. El repositorio se expone como clase abstracta (`PatientAlertRepository`) y el módulo de Nest enlaza el token con `PrismaPatientAlertRepository` vía provider (`{ provide: PatientAlertRepository, useClass: PrismaPatientAlertRepository }`), de modo que los casos de uso se testean con un repositorio en memoria sin tocar la base de datos.

### 3.2 Modelo de dominio

**Entidad `PatientAlert`:**

| Campo       | Tipo                | Notas                                          |
|-------------|---------------------|------------------------------------------------|
| `id`        | UUID                | Identidad                                      |
| `patientId` | UUID                | Paciente al que pertenece                      |
| `type`      | `AlertType`         | `ALLERGY \| MEDICAL_RISK \| SPECIAL_CONDITION \| ADMINISTRATIVE` |
| `severity`  | `AlertSeverity`     | `LOW \| MEDIUM \| HIGH`                        |
| `message`   | string (1–500)      | Texto visible; se normaliza (trim) al crear    |
| `isActive`  | boolean             | Estado de la alerta                            |
| `createdAt` | DateTime            |                                                |
| `updatedAt` | DateTime            |                                                |

Invariantes dentro de la entidad: mensaje no vacío y dentro del límite, tipo y severidad válidos. La **unicidad de alerta activa idéntica** es un invariante *del agregado por paciente*, así que se valida en el caso de uso consultando el repositorio (`findActiveDuplicate(patientId, type, normalizedMessage)`), tanto al **crear** como al **editar/reactivar**.

### 3.3 Casos de uso

| Caso de uso                | Comportamiento                                                                 |
|----------------------------|--------------------------------------------------------------------------------|
| `ListPatientAlerts`        | Devuelve alertas del paciente ordenadas: activas primero, luego por severidad (HIGH→LOW) y fecha de creación descendente. El orden vive aquí (es regla de presentación del dominio, no del frontend). |
| `CreatePatientAlert`       | Valida invariantes, verifica duplicado activo → `DuplicateActiveAlertError` (HTTP 409). |
| `UpdatePatientAlert`       | Edición parcial (tipo, severidad, mensaje, isActive). Si el resultado queda **activo**, re-valida unicidad excluyendo la propia alerta. |
| `DeletePatientAlert`       | Elimina la alerta; `AlertNotFoundError` → HTTP 404.                            |

### 3.4 API HTTP

| Método  | Ruta                            | Descripción                          | Respuestas relevantes        |
|---------|---------------------------------|--------------------------------------|------------------------------|
| GET     | `/patients/:patientId/alerts`   | Listar alertas (activas primero)     | 200                          |
| POST    | `/patients/:patientId/alerts`   | Crear alerta                         | 201 · 400 validación · 409 duplicado |
| PATCH   | `/patient-alerts/:alertId`      | Editar / activar / desactivar        | 200 · 400 · 404 · 409        |
| DELETE  | `/patient-alerts/:alertId`      | Eliminar alerta                      | 204 · 404                    |

Validación de entrada con `class-validator` + `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`): el backend **no confía en el frontend**. Los errores de dominio se traducen a HTTP en un exception filter, manteniendo el controlador delgado.

### 3.5 Persistencia (Prisma)

> **Nota de implementación:** SQLite no soporta enums de Prisma, así que `type` y `severity` son `String` en el esquema; los valores válidos los define el dominio (`AlertType`, `AlertSeverity`) y los validan los DTOs y la entidad. Con PostgreSQL podrían promoverse a enums nativos.

```prisma
model Patient {
  id     String         @id @default(uuid())
  name   String
  dni    String
  alerts PatientAlert[]
}

model PatientAlert {
  id        String        @id @default(uuid())
  patientId String
  patient   Patient       @relation(fields: [patientId], references: [id])
  type      String   // AlertType del dominio
  severity  String   // AlertSeverity del dominio
  message   String
  isActive  Boolean       @default(true)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([patientId, isActive])
}
```

**Defensa en profundidad para la regla anti-duplicados:** la validación principal está en el caso de uso, pero para cubrir condiciones de carrera (dos requests simultáneos) se añade un índice único parcial sobre `(patientId, type, message)` filtrado por `isActive = true` (migración SQL manual, ya que Prisma no modela índices parciales declarativamente). La violación de la restricción se captura en el repositorio y se relanza como `DuplicateActiveAlertError`. Se incluye un paciente *seed* ("Ana Torres") para la ficha mock.

## 4. Frontend

Ficha mock de paciente (datos hardcodeados del paciente seed) que consume la API real para las alertas. SPA ligera (React + Vite) sin librerías de estado pesadas: estado local + fetch encapsulado en un hook.

```
frontend/src/
├── PatientRecordPage.tsx       # Ficha mock: cabecera del paciente + tabs (Datos/Citas/Alertas)
├── alerts/
│   ├── PatientAlertsPanel.tsx  # Orquesta: carga, lista, botón "+ Nueva alerta"
│   ├── AlertCard.tsx           # Fila: badge de severidad, tipo, mensaje, estado, acciones
│   ├── AlertForm.tsx           # Crear/editar: tipo, severidad, mensaje, activo
│   ├── useAlerts.ts            # Hook: fetch, create, update, delete + loading/error
│   └── api.ts                  # Cliente HTTP tipado
└── ...
```

### Estados de UI (criterios de aceptación)

- **Loading:** indicador al cargar la lista y al guardar.
- **Vacío:** mensaje claro cuando el paciente no tiene alertas.
- **Error:** error de carga con opción de reintentar; error de guardado visible en el formulario. Un **409** del backend se muestra como mensaje específico: *"Ya existe una alerta activa idéntica para este paciente"*.
- **Severidad diferenciada visualmente:** badge `HIGH` (rojo) / `MED` (ámbar) / `LOW` (gris-verde).
- **Orden:** la lista llega ya ordenada del backend (activas primero, high destacada); el frontend no reordena.

## 5. Estrategia de tests

| Nivel               | Qué cubre                                                                | Herramienta            |
|---------------------|---------------------------------------------------------------------------|------------------------|
| Unitario (dominio)  | ≥2 tests de la regla: crear duplicado activo falla; crear duplicado de una alerta **inactiva** sí funciona; reactivar generando duplicado falla. Repositorio en memoria. | Jest                   |
| API (e2e)           | ≥1 test: `POST /patients/:id/alerts` feliz + 409 en duplicado + 400 en payload inválido. | Jest + Supertest       |
| UI (bonus)          | PatientAlertsPanel renderiza estados vacío/loading/error y lista ordenada. | Vitest + Testing Library |

Los tests de dominio no tocan Nest ni la base de datos — eso es lo que valida la separación de capas.

## 6. Decisiones técnicas y trade-offs

| Decisión | Alternativa descartada | Razón |
|----------|------------------------|-------|
| Regla anti-duplicados en caso de uso + índice único parcial en DB | Solo en caso de uso | El chequeo aplicativo da errores claros (409 con mensaje), el índice cubre carreras concurrentes. |
| Identidad de "alerta idéntica" = `type + message` normalizado | Incluir severidad | Dos alertas con el mismo tipo y mensaje pero distinta severidad siguen siendo la misma advertencia clínica; permitir ambas duplicaría información ante el personal. |
| Desactivar (soft) como flujo principal; DELETE disponible | Solo borrado físico | En contexto clínico conviene conservar historial; el DELETE existe porque la API lo exige. |
| Repositorio como clase abstracta + DI de Nest | Token string + `@Inject` | Tipado más fuerte y menos fricción en tests. |
| SQLite en dev | PostgreSQL + Docker | La prueba debe ser fácil de correr; el esquema es portable. |
| Frontend sin react-query/redux | Librería de data-fetching | El alcance es un panel: un hook propio mantiene la solución pequeña y legible (criterio de la rúbrica). |

## 7. Setup previsto

```bash
# Backend
cd backend
npm install
npx prisma migrate dev   # crea SQLite + seed del paciente mock
npm run start:dev        # http://localhost:3000
npm test                 # unitarios + e2e

# Frontend
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## 8. Uso de IA

Conforme a la rúbrica, el README raíz documentará: herramienta utilizada (Claude Code), prompts relevantes, qué partes fueron generadas con IA, errores detectados en el output de la IA y qué se revisó/corrigió manualmente. Criterio general: la IA acelera scaffolding, capas repetitivas (DTOs, wiring de módulos) y tests; las decisiones de dominio (invariante de duplicados, semántica de "idéntica", trade-offs de este documento) se definen y revisan manualmente.
