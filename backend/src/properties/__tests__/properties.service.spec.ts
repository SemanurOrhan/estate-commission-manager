import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { PropertiesService } from '../properties.service.js';
import { Property, PropertyDocument, PropertyType } from '../schemas/property.schema.js';
import { CreatePropertyDto } from '../dto/create-property.dto.js';
import { UpdatePropertyDto } from '../dto/update-property.dto.js';

const mockProperty = {
  _id: '507f1f77bcf86cd799439011',
  address: '123 Main St',
  city: 'Springfield',
  postcode: '62701',
  type: PropertyType.SALE,
  askingPrice: 250000,
  description: 'A lovely home',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPropertiesList = [
  mockProperty,
  {
    ...mockProperty,
    _id: '507f1f77bcf86cd799439012',
    address: '42 Oak Ave',
    type: PropertyType.RENTAL,
    askingPrice: 1500,
  },
];

describe('PropertiesService', () => {
  let service: PropertiesService;
  let model: Model<PropertyDocument>;

  const mockSave = jest.fn().mockResolvedValue(mockProperty);

  const mockPropertyModel = jest.fn().mockImplementation(() => ({
    save: mockSave,
  })) as any;

  mockPropertyModel.find = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockPropertiesList),
  });

  mockPropertyModel.findById = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockProperty),
  });

  mockPropertyModel.findByIdAndUpdate = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockProperty),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    model = module.get<Model<PropertyDocument>>(getModelToken(Property.name));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new property', async () => {
      const dto: CreatePropertyDto = {
        address: '123 Main St',
        city: 'Springfield',
        postcode: '62701',
        type: PropertyType.SALE,
        askingPrice: 250000,
        description: 'A lovely home',
      };

      mockSave.mockResolvedValueOnce(mockProperty);

      const result = await service.create(dto);

      expect(mockPropertyModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProperty);
    });
  });

  describe('findAll', () => {
    it('should return an array of properties', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(mockPropertiesList);
      (model.find as jest.Mock).mockReturnValueOnce({ exec: execMock });

      const result = await service.findAll();

      expect(model.find).toHaveBeenCalled();
      expect(result).toEqual(mockPropertiesList);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a single property by ID', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(mockProperty);
      (model.findById as jest.Mock).mockReturnValueOnce({ exec: execMock });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundException if property is not found', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(null);
      (model.findById as jest.Mock).mockReturnValueOnce({ exec: execMock });

      await expect(
        service.findOne('507f1f77bcf86cd799439099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the property', async () => {
      const dto: UpdatePropertyDto = { askingPrice: 275000 };
      const updatedProperty = { ...mockProperty, askingPrice: 275000 };
      const execMock = jest.fn().mockResolvedValueOnce(updatedProperty);
      (model.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        exec: execMock,
      });

      const result = await service.update('507f1f77bcf86cd799439011', dto);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
        { new: true, runValidators: true },
      );
      expect(result.askingPrice).toBe(275000);
    });

    it('should throw NotFoundException if property to update is not found', async () => {
      const execMock = jest.fn().mockResolvedValueOnce(null);
      (model.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        exec: execMock,
      });

      await expect(
        service.update('507f1f77bcf86cd799439099', { askingPrice: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
