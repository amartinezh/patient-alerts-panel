import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  AlertNotFoundError,
  DomainError,
  DuplicateActiveAlertError,
  InvalidAlertDataError,
  PatientNotFoundError,
} from '../../domain/errors/domain.errors';

/**
 * Traduce errores de dominio a codigos HTTP. Mantiene al dominio
 * sin conocimiento de HTTP y al controlador sin manejo de errores.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(exception);
    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }

  private statusFor(exception: DomainError): number {
    if (exception instanceof DuplicateActiveAlertError) {
      return HttpStatus.CONFLICT;
    }
    if (
      exception instanceof AlertNotFoundError ||
      exception instanceof PatientNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof InvalidAlertDataError) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
