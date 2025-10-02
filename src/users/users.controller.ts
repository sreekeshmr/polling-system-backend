import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  UseGuards, 
  Request, 
  Param, 
  Delete, 
  ForbiddenException, 
  NotFoundException 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../shared/entities/user.entity';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'Profile retrieved successfully',
      user: req.user,
    };
  }

  @Patch('profile')
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Users can only update their own profile
    const updatedUser = await this.usersService.update(req.user.id, updateUserDto);
    const { password, ...userWithoutPassword } = updatedUser;
    
    return {
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.usersService.findAll();
    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return {
      message: 'Users retrieved successfully',
      users: safeUsers,
      count: safeUsers.length,
    };
  }

  @Get('admins')
  @Roles(UserRole.ADMIN)
  async findAdmins() {
    const admins = await this.usersService.findAdmins();
    // Remove passwords from response
    const safeAdmins = admins.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
    
    return {
      message: 'Admin users retrieved successfully',
      admins: safeAdmins,
      count: safeAdmins.length,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'User retrieved successfully',
      user: userWithoutPassword,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const updatedUser = await this.usersService.update(id, updateUserDto);
    const { password, ...userWithoutPassword } = updatedUser;
    
    return {
      message: 'User updated successfully',
      user: userWithoutPassword,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    // Prevent users from deleting themselves
    if (req.user.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    
    await this.usersService.delete(id);
    return {
      message: 'User deleted successfully',
    };
  }

  @Get('stats/count')
  @Roles(UserRole.ADMIN)
  async getUserCount() {
    const count = await this.usersService.count();
    return {
      message: 'User count retrieved successfully',
      count,
    };
  }
}