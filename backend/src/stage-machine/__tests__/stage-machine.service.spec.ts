import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StageMachineService } from '../stage-machine.service.js';
import { TransactionStage } from '../../transactions/schemas/transaction.schema.js';

describe('StageMachineService', () => {
  let service: StageMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StageMachineService],
    }).compile();

    service = module.get<StageMachineService>(StageMachineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNextStage', () => {
    it('should transition AGREEMENT -> EARNEST_MONEY', () => {
      expect(service.getNextStage(TransactionStage.AGREEMENT)).toBe(
        TransactionStage.EARNEST_MONEY,
      );
    });

    it('should transition EARNEST_MONEY -> TITLE_DEED', () => {
      expect(service.getNextStage(TransactionStage.EARNEST_MONEY)).toBe(
        TransactionStage.TITLE_DEED,
      );
    });

    it('should transition TITLE_DEED -> COMPLETED', () => {
      expect(service.getNextStage(TransactionStage.TITLE_DEED)).toBe(
        TransactionStage.COMPLETED,
      );
    });

    it('should throw BadRequestException when trying to advance past COMPLETED', () => {
      expect(() => service.getNextStage(TransactionStage.COMPLETED)).toThrow(
        BadRequestException,
      );
    });

    it('should include the final stage name in the error message', () => {
      expect(() => service.getNextStage(TransactionStage.COMPLETED)).toThrow(
        /already in its final stage/,
      );
    });
  });

  describe('validateTransition', () => {
    it('should not throw for a valid AGREEMENT -> EARNEST_MONEY transition', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.AGREEMENT,
          TransactionStage.EARNEST_MONEY,
        ),
      ).not.toThrow();
    });

    it('should not throw for a valid EARNEST_MONEY -> TITLE_DEED transition', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.EARNEST_MONEY,
          TransactionStage.TITLE_DEED,
        ),
      ).not.toThrow();
    });

    it('should not throw for a valid TITLE_DEED -> COMPLETED transition', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.TITLE_DEED,
          TransactionStage.COMPLETED,
        ),
      ).not.toThrow();
    });

    it('should throw BadRequestException for an illegal skip (AGREEMENT -> TITLE_DEED)', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.AGREEMENT,
          TransactionStage.TITLE_DEED,
        ),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for an illegal skip (AGREEMENT -> COMPLETED)', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.AGREEMENT,
          TransactionStage.COMPLETED,
        ),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for a backward transition (EARNEST_MONEY -> AGREEMENT)', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.EARNEST_MONEY,
          TransactionStage.AGREEMENT,
        ),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for a backward transition (COMPLETED -> AGREEMENT)', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.COMPLETED,
          TransactionStage.AGREEMENT,
        ),
      ).toThrow(BadRequestException);
    });

    it('should include expected next stage in the error message for invalid transitions', () => {
      expect(() =>
        service.validateTransition(
          TransactionStage.AGREEMENT,
          TransactionStage.COMPLETED,
        ),
      ).toThrow(/Expected next stage/);
    });
  });

  describe('isCompleted', () => {
    it('should return true for COMPLETED stage', () => {
      expect(service.isCompleted(TransactionStage.COMPLETED)).toBe(true);
    });

    it('should return false for AGREEMENT stage', () => {
      expect(service.isCompleted(TransactionStage.AGREEMENT)).toBe(false);
    });

    it('should return false for EARNEST_MONEY stage', () => {
      expect(service.isCompleted(TransactionStage.EARNEST_MONEY)).toBe(false);
    });

    it('should return false for TITLE_DEED stage', () => {
      expect(service.isCompleted(TransactionStage.TITLE_DEED)).toBe(false);
    });
  });
});
