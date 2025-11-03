import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' })
  @IsNotEmpty({ message: 'E-Mail ist erforderlich' })
  email!: string;

  @IsString({ message: 'Passwort muss eine Zeichenkette sein' })
  @IsNotEmpty({ message: 'Passwort ist erforderlich' })
  @MinLength(6, { message: 'Passwort muss mindestens 6 Zeichen lang sein' })
  password!: string;
}
