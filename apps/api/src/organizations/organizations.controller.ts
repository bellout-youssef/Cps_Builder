import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import type { Organization } from '@prisma/client';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
@RequirePermissions('org:manage')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto): Promise<Organization> {
    return this.organizationsService.create(dto);
  }

  @Get()
  findAll(): Promise<Organization[]> {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Organization> {
    const org = await this.organizationsService.findOne(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    return org;
  }
}
