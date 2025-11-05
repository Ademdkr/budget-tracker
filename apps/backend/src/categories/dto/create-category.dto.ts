import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name der Kategorie',
    example: 'Lebensmittel',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Beschreibung der Kategorie',
    example: 'Ausgaben für Lebensmittel und Getränke',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Farbe der Kategorie (Hex-Code)',
    example: '#FF5722',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Emoji-Icon für die Kategorie',
    example: '🛒',
  })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiProperty({
    description: 'Art der Transaktion',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @ApiProperty({
    description: 'ID des zugehörigen Kontos',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
