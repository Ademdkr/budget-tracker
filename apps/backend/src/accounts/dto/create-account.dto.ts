import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Name des Kontos',
    example: 'Hauptkonto',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Kontotyp',
    enum: AccountType,
    default: AccountType.CHECKING,
    example: AccountType.CHECKING,
  })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType = AccountType.CHECKING;

  @ApiPropertyOptional({
    description: 'Anfangssaldo des Kontos',
    default: 0,
    example: 1000.0,
  })
  @IsNumber()
  @IsOptional()
  balance?: number = 0;

  @ApiPropertyOptional({
    description: 'Währung des Kontos',
    default: 'EUR',
    example: 'EUR',
  })
  @IsString()
  @IsOptional()
  currency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Icon für das Konto',
    example: '💳',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Farbe für das Konto (Hex-Code)',
    example: '#4CAF50',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Zusätzliche Notiz zum Konto',
    example: 'Mein persönliches Girokonto',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Gibt an, ob das Konto aktiv ist',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
