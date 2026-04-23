import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema.js';
import { CreateAgentDto } from './dto/create-agent.dto.js';
import { UpdateAgentDto } from './dto/update-agent.dto.js';


@Injectable()

export class AgentsService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async create(createAgentDto: CreateAgentDto): Promise<AgentDocument> {
    const agent = new this.agentModel(createAgentDto);
    return agent.save();
  }

  async findAll(): Promise<AgentDocument[]> {
    return this.agentModel.find().exec();
  }

  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new NotFoundException(`Agent with ID "${id}" not found`);
    }
    return agent;
  }

  async update(
    id:  string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<AgentDocument> {
    const agent = await this.agentModel.findByIdAndUpdate(id, updateAgentDto, { new: true, runValidators: true }).exec();
    if (!agent) {
      throw new NotFoundException(`Agent with ID "${id}" not found`);
    }return agent;
  }

  async delete(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findByIdAndDelete(id).exec();
    if (!agent) {
      throw new NotFoundException(`Agent with ID "${id}" not found`);
    }
    return agent;
  }
}
