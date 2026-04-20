import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type TransactionDocument = Transaction & Document;


export enum TransactionStage {
  AGREEMENT =     'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}



@Schema({ _id: false  })
export class AgentCommissionEntry {
  @Prop( { type: Types.ObjectId, ref: 'Agent', required: true })
  agentId: Types.ObjectId;

  @Prop({ required: true })
  agentName: string;

  @Prop({ required: true, enum: ['listing', 'selling' , 'dual'] })
  role: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0, max: 100  })
  percentage: number;
}


@Schema({ _id: false })
export class CommissionBreakdown {
  @Prop({ required: true, min: 0 })
  totalServiceFee: number;

  @Prop({ required: true, min: 0 })
  agencyAmount: number;

  @Prop({ required: true })
  agencyPercentage: number;

  @Prop({ type: [AgentCommissionEntry], default: [] })
  agentEntries: AgentCommissionEntry[];

  @Prop({ required: true })
  calculatedAt: Date;
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  agreedPrice: number;

  @Prop({ required: true, min: 0 })
  totalServiceFee: number;

  @Prop({
    required: true,
    enum: TransactionStage,
    default: TransactionStage.AGREEMENT,
  })
  stage: TransactionStage;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  listingAgentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  sellingAgentId: Types.ObjectId;

  @Prop()
  buyerName: string;

  @Prop()
  buyerEmail: string;

  @Prop({ type: [{ stage: String, timestamp: Date, notes: String }], default: [] })
  stageHistory: Array<{ stage: string; timestamp: Date; notes?: string }>;

  @Prop({ type: CommissionBreakdown, default: null })
  commissionBreakdown: CommissionBreakdown | null;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
