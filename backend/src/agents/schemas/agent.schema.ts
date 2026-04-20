import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

@Schema({ timestamps: true })

export class Agent {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: true })
   isActive: boolean;

}

export const AgentSchema = SchemaFactory.createForClass(Agent);
