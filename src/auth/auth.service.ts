import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../shared/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
  console.log('=== 🔐 LOGIN DEBUG START ===');
  console.log('Email:', email);
  console.log('Input password:', password);
  
  const user = await this.usersService.findByEmail(email);
  if (!user) {
    console.log('❌ User not found in database');
    console.log('=== 🔐 LOGIN DEBUG END ===');
    return null;
  }

  console.log('✅ User found:', user.email);
  console.log('Stored hash:', user.password);
  console.log('Hash starts with:', user.password.substring(0, 7));
  console.log('Hash length:', user.password.length);

  // Test bcrypt with a known value
  console.log('--- Testing bcrypt ---');
  const testPassword = 'test123';
  const testHash = await bcrypt.hash(testPassword, 12);
  const testCompare = await bcrypt.compare(testPassword, testHash);
  console.log('BCrypt self-test result:', testCompare);
  
  // Compare the actual password
  console.log('--- Comparing actual password ---');
  console.log('Comparing:', password, 'with stored hash...');
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', isPasswordValid);
  
  if (isPasswordValid) {
    console.log('🎉 LOGIN SUCCESSFUL');
    const { password: _, ...result } = user;
    console.log('=== 🔐 LOGIN DEBUG END ===');
    return result;
  }

  console.log('❌ LOGIN FAILED - Invalid password');
  console.log('=== 🔐 LOGIN DEBUG END ===');
  return null;
}

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

async register(email: string, password: string, role?: UserRole) {
  console.log('=== 👤 REGISTER DEBUG START ===');
  console.log('Raw email:', email);
  console.log('Raw password:', password);
  console.log('Password length:', password.length);
  console.log('Password char codes:', Array.from(password).map(c => c.charCodeAt(0)));
  
  const existingUser = await this.usersService.findByEmail(email);
  if (existingUser) {
    throw new ConflictException('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Hashed password:', hashedPassword);

  const user = await this.usersService.create({
    email,
    password: hashedPassword,
    role: role || UserRole.USER,
  });

  console.log('✅ User created with ID:', user.id);
  console.log('=== 👤 REGISTER DEBUG END ===');
  
  const { password: _, ...result } = user;
  return result;
}

  // 🔍 DEBUG METHOD: Get all users with password info
  async debugUsers() {
    const users = await this.usersService.findAll();
    return users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      password: user.password,
      passwordLength: user.password?.length,
      isBcryptHash: user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$'),
      createdAt: user.createdAt
    }));
  }

  // 🔍 DEBUG METHOD: Check password directly
  async checkPassword(email: string, testPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { error: 'User not found' };
    }

    const isValid = await bcrypt.compare(testPassword, user.password);
    
    return {
      email: user.email,
      storedPassword: user.password,
      storedPasswordLength: user.password.length,
      testPassword: testPassword,
      isValid: isValid,
      isBcryptHash: user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
    };
  }
}