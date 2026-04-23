import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, CommissionBreakdown } from './schemas/transaction.schema.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { StageMachineService } from '../stage-machine/stage-machine.service.js';
import { CommissionService } from '../commission/commission.service.js';
import { AgentsService } from '../agents/agents.service.js';


@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly stageMachineService: StageMachineService,
    private readonly commissionService: CommissionService,
    private readonly agentsService: AgentsService,
  ) { }

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    const transaction = new this.transactionModel(createTransactionDto);
    return transaction.save();
  }

  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find()
      .populate(['listingAgentId', 'sellingAgentId', 'propertyId'])
      .exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate(['listingAgentId', 'sellingAgentId', 'propertyId'])
      .exec();
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
    if (
      this.stageMachineService.isCompleted(transaction.stage) &&
      !transaction.commissionBreakdown
    ) {
      const listingAgentIdStr = this.extractId(transaction.listingAgentId);
      const sellingAgentIdStr = this.extractId(transaction.sellingAgentId);

      const listingAgent = await this.agentsService.findOne(listingAgentIdStr);
      const sellingAgent = await this.agentsService.findOne(sellingAgentIdStr);

      const breakdown = this.commissionService.calculate({
        totalServiceFee: transaction.totalServiceFee,
        listingAgentId: listingAgentIdStr,
        sellingAgentId: sellingAgentIdStr,
        listingAgentName: `${listingAgent.firstName} ${listingAgent.lastName}`,
        sellingAgentName: `${sellingAgent.firstName} ${sellingAgent.lastName}`,
      });

      const result = transaction.toObject();
      result.commissionBreakdown = breakdown as unknown as CommissionBreakdown;
      return result as TransactionDocument;
    }

    return transaction;
  }

  async advanceStage(
    id: string,
    notes?: string,
  ): Promise<TransactionDocument> {
    const transaction = await this.findOne(id);
    const nextStage = this.stageMachineService.getNextStage(transaction.stage);

    const historyEntry = {
      stage: nextStage,
      timestamp: new Date(),
      notes,
    };

    const updatePayload: Record<string, unknown> = {
      $set: { stage: nextStage } as Record<string, unknown>,
      $push: { stageHistory: historyEntry },
    };

    // Eğer işlem 'completed' (tamamlandı) aşamasına geçerse komisyon hesaplamasını tetikle ve dökümü kaydet.
    if (this.stageMachineService.isCompleted(nextStage)) {
      const listingAgentIdStr = this.extractId(transaction.listingAgentId);
      const sellingAgentIdStr = this.extractId(transaction.sellingAgentId);

      const listingAgent = await this.agentsService.findOne(listingAgentIdStr);
      const sellingAgent = await this.agentsService.findOne(sellingAgentIdStr);

      const breakdown = this.commissionService.calculate({
        totalServiceFee: transaction.totalServiceFee,
        listingAgentId: listingAgentIdStr,
        sellingAgentId: sellingAgentIdStr,
        listingAgentName: `${listingAgent.firstName} ${listingAgent.lastName}`,
        sellingAgentName: `${sellingAgent.firstName} ${sellingAgent.lastName}`,
      });

      (updatePayload.$set as Record<string, unknown>).commissionBreakdown = breakdown;
    }

    const updated = await this.transactionModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate(['listingAgentId', 'sellingAgentId', 'propertyId'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }

    return updated;
  }

  // Ref ID'lerini ayıklar
  private extractId(ref: unknown): string {
    if (ref && typeof ref === 'object' && '_id' in ref) {
      return String((ref as Record<string, unknown>)._id);
    }
    return String(ref);
  }
}

