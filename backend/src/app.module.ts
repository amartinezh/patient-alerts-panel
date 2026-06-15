import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DomainErrorFilter } from './patient-alerts/api/filters/domain-error.filter';
import { PatientAlertsModule } from './patient-alerts/patient-alerts.module';

@Module({
  imports: [PatientAlertsModule],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
export class AppModule {}
