import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema.js';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { StageMachineService } from '../stage-machine/stage-machine.service.js';
import { CommissionModule } from '../commission/commission.module.js';
import { AgentsModule } from '../agents/agents.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Transaction.name,
        schema: TransactionSchema
      },
    ]),
    CommissionModule,
    AgentsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, StageMachineService],
  exports: [TransactionsService],
})
export class TransactionsModule { }
