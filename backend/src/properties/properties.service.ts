import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<PropertyDocument> {
    const property = new this.propertyModel(createPropertyDto);
    return property.save();
  }

  async findAll(): Promise<PropertyDocument[]> {
    return this.propertyModel.find().exec();
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found`);
    }
    return property;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<PropertyDocument> {
    const property = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true, runValidators: true })
      .exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found`);
    }
    return property;
  }

  async delete(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findByIdAndDelete(id).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found`);
    }
    return property;
  }
}
