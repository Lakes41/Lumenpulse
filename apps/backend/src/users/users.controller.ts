import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { LinkStellarAccountDto } from './dto/link-stellar-account.dto';
import { StellarAccountResponseDto } from './dto/stellar-account-response.dto';
import { UpdateStellarAccountLabelDto } from './dto/update-stellar-account-label.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Define the user type from the JWT payload
interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Existing endpoints - preserved exactly as they were
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  // New protected endpoints for the authenticated user's Stellar accounts
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/accounts')
  @ApiOperation({ summary: 'Link a new Stellar account to user profile' })
  @ApiResponse({
    status: 201,
    description: 'Stellar account linked successfully',
    type: StellarAccountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid public key or limit reached',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Account already linked to another user',
  })
  async addStellarAccount(
    @Req() req: RequestWithUser,
    @Body() dto: LinkStellarAccountDto,
  ): Promise<StellarAccountResponseDto> {
    const userId: string = req.user.id;
    return this.usersService.addStellarAccount(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/accounts')
  @ApiOperation({ summary: 'Get all linked Stellar accounts for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of linked accounts',
    type: [StellarAccountResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyStellarAccounts(
    @Req() req: RequestWithUser,
  ): Promise<StellarAccountResponseDto[]> {
    const userId: string = req.user.id;
    return this.usersService.getStellarAccounts(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/accounts/:id')
  @ApiOperation({ summary: 'Get a specific Stellar account for current user' })
  @ApiResponse({
    status: 200,
    description: 'Account details',
    type: StellarAccountResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getMyStellarAccount(
    @Req() req: RequestWithUser,
    @Param('id') accountId: string,
  ): Promise<StellarAccountResponseDto> {
    const userId: string = req.user.id;
    return this.usersService.getStellarAccount(userId, accountId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('me/accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a Stellar account from current user' })
  @ApiResponse({ status: 204, description: 'Account unlinked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async removeMyStellarAccount(
    @Req() req: RequestWithUser,
    @Param('id') accountId: string,
  ): Promise<void> {
    const userId: string = req.user.id;
    await this.usersService.removeStellarAccount(userId, accountId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/accounts/:id/label')
  @ApiOperation({ summary: 'Update account label for current user' })
  @ApiResponse({
    status: 200,
    description: 'Label updated successfully',
    type: StellarAccountResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateMyStellarAccountLabel(
    @Req() req: RequestWithUser,
    @Param('id') accountId: string,
    @Body() dto: UpdateStellarAccountLabelDto,
  ): Promise<StellarAccountResponseDto> {
    const userId: string = req.user.id;
    return this.usersService.updateStellarAccountLabel(userId, accountId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/accounts/:id/primary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set as primary account for current user' })
  @ApiResponse({ status: 200, description: 'Primary account set successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async setMyPrimaryAccount(
    @Req() req: RequestWithUser,
    @Param('id') accountId: string,
  ): Promise<void> {
    const userId: string = req.user.id;
    await this.usersService.setPrimaryAccount(userId, accountId);
  }
}
