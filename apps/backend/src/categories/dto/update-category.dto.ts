import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Name der Kategorie',
    example: 'Restaurants',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Beschreibung der Kategorie',
    example: 'Ausgaben für Restaurantbesuche',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Farbe der Kategorie (Hex-Code)',
    example: '#9C27B0',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Emoji-Icon für die Kategorie',
    example: '🍽️',
  })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Art der Transaktion',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;
}
