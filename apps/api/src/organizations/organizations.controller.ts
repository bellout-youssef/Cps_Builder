import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import type { Organization } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { OrganizationsService } from './organizations.service';
import type { OrgWithCounts } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
@RequirePermissions('org:manage')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ─── ORG_ADMIN : mon organisation ──────────────────────────────────────────

  @Get('me')
  @RequirePermissions('settings:manage')
  async getMyOrg(@CurrentUser() user: JwtPayload): Promise<Organization> {
    const org = await this.organizationsService.findOne(user.organizationId!);
    if (!org) throw new NotFoundException('Organisation introuvable.');
    return org;
  }

  @Patch('me')
  @RequirePermissions('settings:manage')
  updateMyOrg(
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Organization> {
    return this.organizationsService.update(user.organizationId!, dto);
  }

  // ─── SUPER_ADMIN : gestion globale ─────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateOrganizationDto): Promise<OrgWithCounts> {
    return this.organizationsService.create(dto);
  }

  @Get()
  findAll(): Promise<OrgWithCounts[]> {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Organization> {
    const org = await this.organizationsService.findOne(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    return org;
  }
}
