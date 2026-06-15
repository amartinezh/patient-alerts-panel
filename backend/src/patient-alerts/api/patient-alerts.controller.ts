import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePatientAlertUseCase } from '../application/create-patient-alert.use-case';
import { DeletePatientAlertUseCase } from '../application/delete-patient-alert.use-case';
import { ListPatientAlertsUseCase } from '../application/list-patient-alerts.use-case';
import { UpdatePatientAlertUseCase } from '../application/update-patient-alert.use-case';
import { CreatePatientAlertDto } from './dto/create-patient-alert.dto';
import { UpdatePatientAlertDto } from './dto/update-patient-alert.dto';
import {
  PatientAlertResponse,
  toPatientAlertResponse,
} from './patient-alert.response';

/**
 * Controlador delgado: valida la entrada (DTO + ValidationPipe global),
 * delega en los casos de uso y mapea la salida. Ninguna regla de negocio aqui.
 */
@Controller()
export class PatientAlertsController {
  constructor(
    private readonly listAlerts: ListPatientAlertsUseCase,
    private readonly createAlert: CreatePatientAlertUseCase,
    private readonly updateAlert: UpdatePatientAlertUseCase,
    private readonly deleteAlert: DeletePatientAlertUseCase,
  ) {}

  @Get('patients/:patientId/alerts')
  async list(
    @Param('patientId') patientId: string,
  ): Promise<PatientAlertResponse[]> {
    const alerts = await this.listAlerts.execute(patientId);
    return alerts.map(toPatientAlertResponse);
  }

  @Post('patients/:patientId/alerts')
  async create(
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientAlertDto,
  ): Promise<PatientAlertResponse> {
    const alert = await this.createAlert.execute({ patientId, ...dto });
    return toPatientAlertResponse(alert);
  }

  @Patch('patient-alerts/:alertId')
  async update(
    @Param('alertId') alertId: string,
    @Body() dto: UpdatePatientAlertDto,
  ): Promise<PatientAlertResponse> {
    const alert = await this.updateAlert.execute(alertId, dto);
    return toPatientAlertResponse(alert);
  }

  @Delete('patient-alerts/:alertId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('alertId') alertId: string): Promise<void> {
    await this.deleteAlert.execute(alertId);
  }
}
