import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AlertSeverity } from '../../domain/alert-severity';
import { AlertType } from '../../domain/alert-type';
import { MAX_MESSAGE_LENGTH } from '../../domain/patient-alert.entity';

export class CreatePatientAlertDto {
  @IsEnum(AlertType, {
    message: `type debe ser uno de: ${Object.values(AlertType).join(', ')}`,
  })
  type!: AlertType;

  @IsEnum(AlertSeverity, {
    message: `severity debe ser uno de: ${Object.values(AlertSeverity).join(', ')}`,
  })
  severity!: AlertSeverity;

  @IsString()
  @IsNotEmpty({ message: 'message no puede estar vacio' })
  @MaxLength(MAX_MESSAGE_LENGTH)
  message!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
