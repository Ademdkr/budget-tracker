import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Benutzer anmelden',
    description:
      'Meldet einen Benutzer an und gibt Access- und Refresh-Tokens zurück',
  })
  @ApiResponse({
    status: 200,
    description: 'Login erfolgreich',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Ungültige Eingabedaten' })
  @ApiUnauthorizedResponse({ description: 'Ungültige Anmeldedaten' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      return await this.authService.login(loginDto);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Login fehlgeschlagen',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('users')
  @ApiOperation({
    summary: 'Alle Benutzer abrufen',
    description: 'Gibt eine Liste aller registrierten Benutzer zurück',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste der Benutzer erfolgreich abgerufen',
  })
  @ApiResponse({
    status: 500,
    description: 'Interner Serverfehler',
  })
  async getAllUsers() {
    try {
      return await this.authService.findAllUsers();
    } catch {
      throw new HttpException(
        'Fehler beim Laden der Benutzer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
