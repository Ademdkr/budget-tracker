import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
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
