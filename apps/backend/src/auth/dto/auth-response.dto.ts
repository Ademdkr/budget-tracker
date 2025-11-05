import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ description: 'Benutzer-ID', example: '1' })
  id!: string;

  @ApiProperty({ description: 'Vorname des Benutzers', example: 'Max' })
  name!: string;

  @ApiProperty({ description: 'Nachname des Benutzers', example: 'Mustermann' })
  surname!: string;

  @ApiProperty({ description: 'E-Mail-Adresse', example: 'max@example.com' })
  email!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({ description: 'Benutzerdaten', type: UserDto })
  user!: UserDto;
}
