import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  name!: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType = AccountType.CHECKING;

  @IsNumber()
  @IsOptional()
  balance?: number = 0;

  @IsString()
  @IsOptional()
  currency?: string = 'EUR';

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
