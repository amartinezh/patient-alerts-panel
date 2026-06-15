import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Reemplaza la config deprecada de `package.json#prisma`.
// Nota: al existir un prisma.config.ts, Prisma deja de cargar `.env`
// automaticamente, por eso lo cargamos arriba con `dotenv/config`.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
