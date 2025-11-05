import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'E-Mail-Adresse des Benutzers',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' })
  @IsNotEmpty({ message: 'E-Mail ist erforderlich' })
  email!: string;

  @ApiProperty({
    description: 'Passwort des Benutzers',
    example: 'password123',
    minLength: 6,
    type: String,
  })
  @IsString({ message: 'Passwort muss eine Zeichenkette sein' })
  @IsNotEmpty({ message: 'Passwort ist erforderlich' })
  @MinLength(6, { message: 'Passwort muss mindestens 6 Zeichen lang sein' })
  password!: string;
}
