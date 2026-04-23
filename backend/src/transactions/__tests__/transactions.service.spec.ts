import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionsService } from '../transactions.service.js';
import { Transaction, TransactionStage } from '../schemas/transaction.schema.js';
import { StageMachineService } from '../../stage-machine/stage-machine.service.js';
import { CommissionService } from '../../commission/commission.service.js';
import { AgentsService } from '../../agents/agents.service.js';

const agentAId = new Types.ObjectId();
const agentBId = new Types.ObjectId();
const propertyId = new Types.ObjectId();
const transactionId = '507f1f77bcf86cd799439011';

const mockAgent = (id: Types.ObjectId, first: string, last: string) => ({
  _id: id,
  firstName: first,
  lastName: last,
  email: `${first.toLowerCase()}@example.com`,
  phone: '+1234567890',
  isActive: true,
});

const createMockTransaction = (stage: TransactionStage) => ({
  _id: transactionId,
  propertyId,
  agreedPrice: 200000,
  totalServiceFee: 10000,
  stage,
  listingAgentId: agentAId,
  sellingAgentId: agentBId,
  buyerName: 'Test Buyer',
  buyerEmail: 'buyer@example.com',
  stageHistory: [],
  commissionBreakdown: null,
  save: jest.fn(),
});

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockSave = jest.fn();

  const mockTransactionModel = jest.fn().mockImplementation(() => ({
    save: mockSave,
  })) as any;

  const populateMock = jest.fn().mockReturnThis();
  const execMock = jest.fn();

  mockTransactionModel.find = jest.fn().mockReturnValue({
    populate: populateMock,
    exec: execMock,
  });

  mockTransactionModel.findById = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({ exec: execMock }),
  });

  mockTransactionModel.findByIdAndUpdate = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({ exec: execMock }),
  });

  const mockStageMachineService = {
    getNextStage: jest.fn(),
    validateTransition: jest.fn(),
    isCompleted: jest.fn(),
  };

  const mockCommissionService = {
    calculate: jest.fn(),
  };

  const mockAgentsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: StageMachineService,
          useValue: mockStageMachineService,
        },
        {
          provide: CommissionService,
          useValue: mockCommissionService,
        },
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);


    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new transaction', async () => {
      const dto = {
        propertyId: propertyId.toString(),
        agreedPrice: 200000,
        totalServiceFee: 10000,
        listingAgentId: agentAId.toString(),
        sellingAgentId: agentBId.toString(),
        buyerName: 'Test Buyer',
        buyerEmail: 'buyer@example.com',
      };
      const mockTx = createMockTransaction(TransactionStage.AGREEMENT);
      mockSave.mockResolvedValueOnce(mockTx);

      const result = await service.create(dto);

      expect(mockTransactionModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTx);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by ID', async () => {
      const mockTx = createMockTransaction(TransactionStage.AGREEMENT);
      const innerExec = jest.fn().mockResolvedValueOnce(mockTx);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: innerExec }),
      });

      mockStageMachineService.isCompleted.mockReturnValueOnce(false);

      const result = await service.findOne(transactionId);
      expect(result).toEqual(mockTx);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      const innerExec = jest.fn().mockResolvedValueOnce(null);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: innerExec }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('advanceStage', () => {
    it('should advance the stage and push to stageHistory', async () => {
      const mockTx = createMockTransaction(TransactionStage.AGREEMENT);
      const updatedTx = {
        ...mockTx,
        stage: TransactionStage.EARNEST_MONEY,
      };

      // findOne (via findById) - İşlemi bulur
      const findExec = jest.fn().mockResolvedValueOnce(mockTx);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: findExec }),
      });

      // Adımı bir sonraki aşamaya taşır
      mockStageMachineService.getNextStage.mockReturnValueOnce(
        TransactionStage.EARNEST_MONEY,
      );
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);

      // findByIdAndUpdate - id ile eşleşen transaction bulunur
      const updateExec = jest.fn().mockResolvedValueOnce(updatedTx);
      (mockTransactionModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: updateExec }),
      });

      const result = await service.advanceStage(transactionId, 'Test notes');

      expect(mockStageMachineService.getNextStage).toHaveBeenCalledWith(
        TransactionStage.AGREEMENT,
      );
      expect(
        mockTransactionModel.findByIdAndUpdate,
      ).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          $set: expect.objectContaining({
            stage: TransactionStage.EARNEST_MONEY,
          }),
          $push: expect.objectContaining({
            stageHistory: expect.objectContaining({
              stage: TransactionStage.EARNEST_MONEY,
              notes: 'Test notes',
            }),
          }),
        }),
        { new: true },
      );
      expect(result.stage).toBe(TransactionStage.EARNEST_MONEY);
    });

    it('should NOT call CommissionService when stage is not COMPLETED', async () => {
      const mockTx = createMockTransaction(TransactionStage.AGREEMENT);
      const updatedTx = {
        ...mockTx,
        stage: TransactionStage.EARNEST_MONEY,
      };

      const findExec = jest.fn().mockResolvedValueOnce(mockTx);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: findExec }),
      });

      mockStageMachineService.getNextStage.mockReturnValueOnce(
        TransactionStage.EARNEST_MONEY,
      );
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);

      const updateExec = jest.fn().mockResolvedValueOnce(updatedTx);
      (mockTransactionModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: updateExec }),
      });

      await service.advanceStage(transactionId);

      expect(mockCommissionService.calculate).not.toHaveBeenCalled();
      expect(mockAgentsService.findOne).not.toHaveBeenCalled();
    });

    it('should call CommissionService.calculate() when advancing to COMPLETED', async () => {
      const mockTx = createMockTransaction(TransactionStage.TITLE_DEED);
      const mockBreakdown = {
        totalServiceFee: 10000,
        agencyAmount: 5000,
        agencyPercentage: 50,
        agentEntries: [
          {
            agentId: agentAId.toString(),
            agentName: 'Alice Smith',
            role: 'listing',
            amount: 2500,
            percentage: 25,
          },
          {
            agentId: agentBId.toString(),
            agentName: 'Bob Jones',
            role: 'selling',
            amount: 2500,
            percentage: 25,
          },
        ],
        calculatedAt: new Date(),
      };

      const completedTx = {
        ...mockTx,
        stage: TransactionStage.COMPLETED,
        commissionBreakdown: mockBreakdown,
      };

      const findExec = jest.fn().mockResolvedValueOnce(mockTx);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: findExec }),
      });

      mockStageMachineService.getNextStage.mockReturnValueOnce(
        TransactionStage.COMPLETED,
      );
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);
      mockStageMachineService.isCompleted.mockReturnValueOnce(true);

      mockAgentsService.findOne
        .mockResolvedValueOnce(mockAgent(agentAId, 'Alice', 'Smith'))
        .mockResolvedValueOnce(mockAgent(agentBId, 'Bob', 'Jones'));

      mockCommissionService.calculate.mockReturnValueOnce(mockBreakdown);

      const updateExec = jest.fn().mockResolvedValueOnce(completedTx);
      (mockTransactionModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: updateExec }),
      });

      const result = await service.advanceStage(transactionId, 'Final step');

      expect(mockCommissionService.calculate).toHaveBeenCalledTimes(1);
      expect(mockCommissionService.calculate).toHaveBeenCalledWith({
        totalServiceFee: 10000,
        listingAgentId: agentAId.toString(),
        sellingAgentId: agentBId.toString(),
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      expect(
        mockTransactionModel.findByIdAndUpdate,
      ).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          $set: expect.objectContaining({
            stage: TransactionStage.COMPLETED,
            commissionBreakdown: mockBreakdown,
          }),
        }),
        { new: true },
      );
      expect(result.commissionBreakdown).toEqual(mockBreakdown);
    });

    it('should look up agent names from AgentsService before calculating commission', async () => {
      const mockTx = createMockTransaction(TransactionStage.TITLE_DEED);

      const findExec = jest.fn().mockResolvedValueOnce(mockTx);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: findExec }),
      });

      mockStageMachineService.getNextStage.mockReturnValueOnce(
        TransactionStage.COMPLETED,
      );
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);
      mockStageMachineService.isCompleted.mockReturnValueOnce(true);

      mockAgentsService.findOne
        .mockResolvedValueOnce(mockAgent(agentAId, 'Alice', 'Smith'))
        .mockResolvedValueOnce(mockAgent(agentBId, 'Bob', 'Jones'));

      mockCommissionService.calculate.mockReturnValue({
        totalServiceFee: 10000,
        agencyAmount: 5000,
        agencyPercentage: 50,
        agentEntries: [],
        calculatedAt: new Date(),
      });

      const updateExec = jest.fn().mockResolvedValueOnce({
        ...mockTx,
        stage: TransactionStage.COMPLETED,
      });
      (mockTransactionModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: updateExec }),
      });

      await service.advanceStage(transactionId);

      expect(mockAgentsService.findOne).toHaveBeenCalledTimes(2);
      expect(mockAgentsService.findOne).toHaveBeenCalledWith(
        agentAId.toString(),
      );
      expect(mockAgentsService.findOne).toHaveBeenCalledWith(
        agentBId.toString(),
      );
    });

    it('should include stageHistory entry with notes when advancing to any stage', async () => {
      const mockTx = createMockTransaction(TransactionStage.EARNEST_MONEY);
      const updatedTx = {
        ...mockTx,
        stage: TransactionStage.TITLE_DEED,
      };

      const findExec = jest.fn().mockResolvedValueOnce(mockTx);
      (mockTransactionModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: findExec }),
      });

      mockStageMachineService.getNextStage.mockReturnValueOnce(
        TransactionStage.TITLE_DEED,
      );
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);
      mockStageMachineService.isCompleted.mockReturnValueOnce(false);

      const updateExec = jest.fn().mockResolvedValueOnce(updatedTx);
      (mockTransactionModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({ exec: updateExec }),
      });

      await service.advanceStage(transactionId, 'Documents verified');

      const updateCall = (mockTransactionModel.findByIdAndUpdate as jest.Mock)
        .mock.calls[0];
      const payload = updateCall[1];
      expect(payload.$push.stageHistory.stage).toBe(
        TransactionStage.TITLE_DEED,
      );
      expect(payload.$push.stageHistory.notes).toBe('Documents verified');
      expect(payload.$push.stageHistory.timestamp).toBeInstanceOf(Date);
    });
  });
});
