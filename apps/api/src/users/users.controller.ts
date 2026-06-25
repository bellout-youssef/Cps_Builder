import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:manage')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user.organizationId!);
  }

  @Post()
  @RequirePermissions('users:manage')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.create(dto, user.organizationId!);
  }

  @Patch(':id/roles')
  @RequirePermissions('roles:manage')
  updateRoles(
    @Param('id') id: string,
    @Body() dto: UpdateRolesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateRoles(id, dto, user.organizationId!);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('users:manage')
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.deactivate(id, user.organizationId!);
  }

  @Patch(':id/reactivate')
  @RequirePermissions('users:manage')
  reactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.reactivate(id, user.organizationId!);
  }

  @Post(':id/reset-password')
  @RequirePermissions('users:manage')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.resetPassword(id, dto, user.organizationId!);
  }
}
