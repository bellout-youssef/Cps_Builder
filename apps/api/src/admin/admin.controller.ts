import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AdminService } from './admin.service';
import type { MonitoringStats } from './admin.service';

@Controller('admin')
@RequirePermissions('org:manage')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('monitoring')
  getMonitoringStats(): Promise<MonitoringStats> {
    return this.adminService.getMonitoringStats();
  }
}
