import { Injectable, BadRequestException } from '@nestjs/common';
import { TransactionStage } from '../transactions/schemas/transaction.schema.js';

@Injectable()
export class StageMachineService {
  // yasal-finansal süreç bütünlüğünü korumak için geriye dönük state değişimi engellenmesi
  private readonly validTransitions = new Map<TransactionStage, TransactionStage>([
    [TransactionStage.AGREEMENT, TransactionStage.EARNEST_MONEY],
    [TransactionStage.EARNEST_MONEY, TransactionStage.TITLE_DEED],
    [TransactionStage.TITLE_DEED, TransactionStage.COMPLETED],
  ]);

  // nextStage'e ulaşılamazsa exception fırlatılır
  getNextStage(currentStage: TransactionStage): TransactionStage {
    const nextStage = this.validTransitions.get(currentStage);
    if (!nextStage) {
      throw new BadRequestException(
        `Transaction is already in its final stage: '${currentStage}'. No further transitions are allowed.`,
      );
    }
    return nextStage;
  }

  // propose edilen target stage, mevcut stage için yasal bir sonraki adım mı diye kontrol eder
  validateTransition(currentStage: TransactionStage, targetStage: TransactionStage): void {
    const nextStage = this.validTransitions.get(currentStage);
    if (nextStage !== targetStage) {
      throw new BadRequestException(
        `Invalid stage transition from '${currentStage}' to '${targetStage}'. ` +
        `Expected next stage: '${nextStage ?? 'none (final stage)'}'.`,
      );
    }
  }

  isCompleted(stage: TransactionStage): boolean {
    return stage === TransactionStage.COMPLETED;
  }
}
