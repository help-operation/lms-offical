import { Module } from '@nestjs/common';
import { RbacSeederService } from './rbac-seeder.service';
import { RbacService } from './rbac.service';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  controllers: [RolesController],
  providers: [RbacSeederService, RbacService, RolesService],
  exports: [RbacService],
})
export class RbacModule {}
