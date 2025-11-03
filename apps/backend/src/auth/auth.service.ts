import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Benutzer nicht gefunden');
    }

    // In production, you should hash passwords and compare properly
    if (user.password !== password) {
      throw new Error('Ungültiges Passwort');
    }

    // Generate tokens (simplified for demo)
    const accessToken = this.generateToken(user.id.toString(), user.email);
    const refreshToken = this.generateRefreshToken(user.id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email,
      },
    };
  }

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        createdAt: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    return users.map((user) => ({
      ...user,
      id: user.id.toString(),
    }));
  }

  private generateToken(userId: string, email: string): string {
    // In production, use proper JWT library
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      }),
    ).toString('base64url');
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }

  private generateRefreshToken(userId: string): string {
    // In production, use proper JWT library and store in database
    return `refresh-token-${userId}-${Date.now()}`;
  }
}
