import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PatientRepository } from '../domain/patient.repository';

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async exists(patientId: string): Promise<boolean> {
    const count = await this.prisma.patient.count({
      where: { id: patientId },
    });
    return count > 0;
  }
}
