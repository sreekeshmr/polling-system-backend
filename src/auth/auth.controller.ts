import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.role,
    );
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'Profile retrieved successfully',
      user: req.user,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout() {
    return { message: 'Successfully logged out' };
  }

  // 🔍 ADD THIS TEMPORARY DEBUG ENDPOINT
  @Get('debug-users')
  async debugUsers() {
    const users = await this.authService.debugUsers();
    return users;
  }

  // 🔍 ADD THIS TO CHECK PASSWORD
  @Get('check-password')
  async checkPassword() {
    const result = await this.authService.checkPassword('admin@example.com', 'password123');
    return result;
  }
}