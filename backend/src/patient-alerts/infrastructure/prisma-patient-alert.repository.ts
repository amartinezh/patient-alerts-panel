import { Injectable } from '@nestjs/common';
import { Prisma, PatientAlert as PrismaPatientAlert } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertSeverity } from '../domain/alert-severity';
import { AlertType } from '../domain/alert-type';
import { DuplicateActiveAlertError } from '../domain/errors/domain.errors';
import { PatientAlert } from '../domain/patient-alert.entity';
import { PatientAlertRepository } from '../domain/patient-alert.repository';

@Injectable()
export class PrismaPatientAlertRepository extends PatientAlertRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByPatientId(patientId: string): Promise<PatientAlert[]> {
    const rows = await this.prisma.patientAlert.findMany({
      where: { patientId },
    });
    return rows.map(toDomain);
  }

  async findById(alertId: string): Promise<PatientAlert | null> {
    const row = await this.prisma.patientAlert.findUnique({
      where: { id: alertId },
    });
    return row ? toDomain(row) : null;
  }

  async findActiveDuplicate(
    patientId: string,
    type: AlertType,
    message: string,
    excludeAlertId?: string,
  ): Promise<PatientAlert | null> {
    // SQLite no soporta `mode: 'insensitive'` en Prisma, asi que la
    // comparacion case-insensitive del mensaje se hace en memoria sobre
    // el subconjunto ya filtrado (paciente + tipo + activas).
    const candidates = await this.prisma.patientAlert.findMany({
      where: {
        patientId,
        type,
        isActive: true,
        ...(excludeAlertId ? { id: { not: excludeAlertId } } : {}),
      },
    });
    const normalized = message.toLowerCase();
    const match = candidates.find(
      (c) => c.message.toLowerCase() === normalized,
    );
    return match ? toDomain(match) : null;
  }

  async save(alert: PatientAlert): Promise<void> {
    const data = {
      patientId: alert.patientId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      isActive: alert.isActive,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
    try {
      await this.prisma.patientAlert.upsert({
        where: { id: alert.id },
        create: { id: alert.id, ...data },
        update: data,
      });
    } catch (error) {
      // El indice unico parcial de la base cubre condiciones de carrera
      // que el chequeo del caso de uso no alcanza a ver.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateActiveAlertError();
      }
      throw error;
    }
  }

  async delete(alertId: string): Promise<void> {
    await this.prisma.patientAlert.delete({ where: { id: alertId } });
  }
}

function toDomain(row: PrismaPatientAlert): PatientAlert {
  return PatientAlert.fromPersistence({
    id: row.id,
    patientId: row.patientId,
    type: row.type as AlertType,
    severity: row.severity as AlertSeverity,
    message: row.message,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
