import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service.js';

@Module({
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
