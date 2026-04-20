import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { AgentsService } from '../agents.service.js';
import { Agent, AgentDocument } from '../schemas/agent.schema.js';
import { CreateAgentDto } from '../dto/create-agent.dto.js';
import { UpdateAgentDto } from '../dto/update-agent.dto.js';

const mockAgent = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAgentsList = [
  mockAgent,
  {
    ...mockAgent,
    _id: '507f1f77bcf86cd799439012',
    firstName: 'Jane',
    email: 'jane.doe@example.com',
  },
];

describe('AgentsService', () => {

  let service: AgentsService;
  let model: Model<AgentDocument>;

  const mockSave = jest.fn().mockResolvedValue(mockAgent);

  const mockAgentModel = jest.fn().mockImplementation(() => ({ save: mockSave })) as any;

  mockAgentModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgentsList) });

  mockAgentModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

  mockAgentModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: getModelToken(Agent.name),
          useValue: mockAgentModel,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    model = module.get<Model<AgentDocument>>(getModelToken(Agent.name));
    jest.clearAllMocks();
  });


  it('should be defined ', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {

    it('should create and return a new agent', async () => {
      const dto: CreateAgentDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
      };

      mockSave.mockResolvedValueOnce(mockAgent);


      const result = await service.create(dto);

      expect(mockAgentModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAgent);
    });
  });

  describe('findAll', () => {

    it('should return an array of agents', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(mockAgentsList);
      (model.find as jest.Mock).mockReturnValueOnce({ exec: execMock });
      const result = await service.findAll();

      expect(model.find).toHaveBeenCalled();
      expect(result).toEqual(mockAgentsList);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {

    it('should return a single agent by ID', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(mockAgent);
      (model.findById as jest.Mock).mockReturnValueOnce({ exec: execMock });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockAgent);
    });


    it('should throw NotFoundException if agent is not found', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(null);
      (model.findById as jest.Mock).mockReturnValueOnce({ exec: execMock });

      await expect(
        service.findOne('507f1f77bcf86cd799439099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {

    it('should update and return the agent', async () => {
      const dto: UpdateAgentDto = { firstName: 'Updated' };
      const updatedAgent = { ...mockAgent, firstName: 'Updated' };
      const execMock = jest.fn().mockResolvedValueOnce(updatedAgent);
      (model.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        exec: execMock,
      });

      const result = await service.update('507f1f77bcf86cd799439011', dto);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
        { new: true, runValidators: true },
      );
      expect(result.firstName).toBe('Updated');
    });


    it('should throw NotFoundException if agent to update is not found', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(null);
      (model.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        exec: execMock,
      }
      );

      await expect(service.update('507f1f77bcf86cd799439099', { firstName: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});


