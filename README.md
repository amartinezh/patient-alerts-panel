# PatientAlertsPanel — ClinicSay (prueba take-home fullstack)

Panel de **alertas clínicas** en la ficha del paciente: backend NestJS + Prisma con DDD, frontend React + Vite consumiendo la API real sobre una ficha mock.

> El diseño completo está en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Estructura

```
patient-alerts-panel/
├── docs/        # Documento de arquitectura
├── backend/     # API NestJS + Prisma (DDD, SQLite)
└── frontend/    # Ficha mock + PatientAlertsPanel (React + Vite)
```

## Setup

Requisitos: Node 20+.

### Backend (puerto 3000)

```bash
cd backend
npm install
npx prisma migrate dev    # crea SQLite (dev.db) y aplica migraciones
npx prisma db seed        # paciente mock "Ana Torres" + 2 alertas
npm run start:dev
```

### Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev               # abre http://localhost:5173
```

La ficha mock apunta al paciente del seed (id fijo compartido en `backend/prisma/seed.ts` y `frontend/src/patient.ts`).

## Tests

```bash
# Backend: 12 unitarios (regla de negocio) + 6 e2e (API)
cd backend
npm test            # unitarios
npm run test:e2e    # API con supertest

# Frontend: 3 tests de UI (bonus) con Vitest + Testing Library
cd frontend
npm test
```

## API

| Método | Ruta                          | Descripción                      | Códigos             |
|--------|-------------------------------|----------------------------------|---------------------|
| GET    | `/patients/:patientId/alerts` | Lista (activas primero)          | 200                 |
| POST   | `/patients/:patientId/alerts` | Crea alerta                      | 201 · 400 · 404 · 409 |
| PATCH  | `/patient-alerts/:alertId`    | Edita / activa / desactiva       | 200 · 400 · 404 · 409 |
| DELETE | `/patient-alerts/:alertId`    | Elimina                          | 204 · 404           |

## Regla de negocio clave

**No puede existir más de una alerta activa idéntica para el mismo paciente.** "Idéntica" = mismo `patientId + type + message`, con mensaje normalizado (trim, espacios colapsados) y comparación sin distinción de mayúsculas. La regla vive en los casos de uso (`CreatePatientAlertUseCase` y `UpdatePatientAlertUseCase` — crear, editar y reactivar la validan), y se refuerza con un **índice único parcial** en SQLite (`WHERE isActive = true`, añadido a mano en la migración) que cubre condiciones de carrera; la violación se traduce a `409 Conflict`.

## Decisiones técnicas

- **DDD en 4 capas** (`domain` → `application` → `infrastructure` / `api`): el dominio no importa nada de Nest ni Prisma. Los repositorios son clases abstractas (puertos) enlazadas por DI; los tests de casos de uso corren con repos en memoria, sin base de datos.
- **Identidad de "alerta idéntica" sin severidad**: dos alertas con igual tipo y mensaje pero distinta severidad serían la misma advertencia duplicada ante el personal clínico.
- **SQLite** para que la prueba corra sin Docker; el esquema es portable a PostgreSQL. SQLite no soporta enums de Prisma, así que `type`/`severity` son `String` en el esquema y los valores válidos los define y valida el dominio (+ DTOs).
- **Desactivar como flujo principal** (conserva historial clínico); DELETE existe porque la API lo exige.
- **Controlador delgado**: validación de entrada con `class-validator` (`whitelist` + `forbidNonWhitelisted`), errores de dominio traducidos a HTTP en un exception filter. El backend no confía en el frontend.
- **Orden de la lista en el backend** (activas primero, severidad HIGH→LOW, recientes primero): es regla de presentación del negocio; el frontend no reordena.
- **Frontend sin librerías de estado**: un hook `useAlerts` con fetch nativo; tras cada mutación se re-consulta la lista (el backend es la fuente de verdad). Estados de loading, vacío, error de carga (con reintento) y error de guardado (409 muestra el mensaje específico del backend).

## Uso de IA

- **Herramienta**: Claude Code (Anthropic) como asistente de diseño e implementación, dirigido por prompts iterativos.
- **Flujo**: (1) prompt inicial con el fin de componer el documento de arquitectura; (2) revisión humana del diseño contra la rúbrica (cobertura por criterio) antes de codear; (3) prompt de implementación completa siguiendo esa arquitectura, con verificación automática en cada paso (tests, build, smoke tests con curl).
- **Partes generadas con IA**: scaffolding de ambos proyectos, capas DDD del backend, componentes React, estilos, tests.
- **Decisiones tomadas/revisadas manualmente**: la semántica de "alerta idéntica" (tipo + mensaje normalizado, sin severidad), dónde vive la regla (caso de uso + índice de DB como defensa en profundidad), desactivación como flujo principal frente a borrado, y la elección de React/SQLite.
- **Errores y ajustes detectados durante la sesión**: Prisma no soporta enums sobre SQLite (se movieron los enums al dominio y el esquema usa `String`); Prisma no modela índices únicos parciales declarativamente (se generó la migración con `--create-only` y se editó el SQL a mano); la plantilla de Vite (TS 6, `erasableSyntaxOnly`) prohíbe enums de TypeScript en el frontend (se usaron uniones de literales `as const`).
- **Validación**: todo lo generado se verificó ejecutándolo — 12 tests unitarios, 6 e2e, 3 de UI, builds de ambos proyectos y smoke test manual de la API (201/400/404/409 contra la base real).
