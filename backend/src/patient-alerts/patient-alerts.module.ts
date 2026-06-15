import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatientAlertsController } from './api/patient-alerts.controller';
import { CreatePatientAlertUseCase } from './application/create-patient-alert.use-case';
import { DeletePatientAlertUseCase } from './application/delete-patient-alert.use-case';
import { ListPatientAlertsUseCase } from './application/list-patient-alerts.use-case';
import { UpdatePatientAlertUseCase } from './application/update-patient-alert.use-case';
import { PatientAlertRepository } from './domain/patient-alert.repository';
import { PatientRepository } from './domain/patient.repository';
import { PrismaPatientAlertRepository } from './infrastructure/prisma-patient-alert.repository';
import { PrismaPatientRepository } from './infrastructure/prisma-patient.repository';

@Module({
  controllers: [PatientAlertsController],
  providers: [
    PrismaService,
    { provide: PatientAlertRepository, useClass: PrismaPatientAlertRepository },
    { provide: PatientRepository, useClass: PrismaPatientRepository },
    ListPatientAlertsUseCase,
    CreatePatientAlertUseCase,
    UpdatePatientAlertUseCase,
    DeletePatientAlertUseCase,
  ],
})
export class PatientAlertsModule {}
