import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Name des Kontos',
    example: 'Sparkonto',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Kontotyp',
    enum: AccountType,
    example: AccountType.SAVINGS,
  })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @ApiPropertyOptional({
    description: 'Kontostand',
    example: 5000.0,
  })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({
    description: 'Währung des Kontos',
    example: 'EUR',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Icon für das Konto',
    example: '🏦',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Farbe für das Konto (Hex-Code)',
    example: '#2196F3',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Zusätzliche Notiz zum Konto',
    example: 'Sparkonto für den Urlaub',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Gibt an, ob das Konto aktiv ist',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
