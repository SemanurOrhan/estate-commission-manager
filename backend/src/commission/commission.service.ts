import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

export interface CommissionInput {
  totalServiceFee: number;
  listingAgentId: Types.ObjectId | string;
  sellingAgentId: Types.ObjectId | string;
  listingAgentName: string;
  sellingAgentName: string;
}

export interface AgentCommissionResult {
  agentId: string;
  agentName: string;
  role: 'listing' | 'selling' | 'dual';
  amount: number;
  percentage: number;
}

export interface CommissionResult {
  totalServiceFee: number;
  agencyAmount: number;
  agencyPercentage: number;
  agentEntries: AgentCommissionResult[];
  calculatedAt: Date;
}

@Injectable()
export class CommissionService {
  private readonly AGENCY_SHARE = 0.5;
  private readonly DUAL_AGENT_SHARE = 0.5;
  private readonly SPLIT_AGENT_SHARE = 0.25;

  calculate(input: CommissionInput): CommissionResult {
    const {
      totalServiceFee,
      listingAgentId,
      sellingAgentId,
      listingAgentName,
      sellingAgentName,
    } = input;

    const agencyAmount = totalServiceFee * this.AGENCY_SHARE;
    const isDualAgent = listingAgentId.toString() === sellingAgentId.toString();
    const calculatedAt = new Date();

    if (isDualAgent) {
      // Senaryo 1: Evi listeleyen ve satan aynı kişiyse, danışman payının tamamını o alır.
      return {
        totalServiceFee,
        agencyAmount,
        agencyPercentage: 50,
        agentEntries: [
          {
            agentId: listingAgentId.toString(),
            agentName: listingAgentName,
            role: 'dual',
            amount: totalServiceFee * this.DUAL_AGENT_SHARE,
            percentage: 50,
          },
        ],
        calculatedAt,
      };
    }

    // Senaryo 2: Listeleyen ve satan farklıysa, danışman payı %25 - %25 paylaştırılır.
    return {
      totalServiceFee,
      agencyAmount,
      agencyPercentage: 50,
      agentEntries: [
        {
          agentId: listingAgentId.toString(),
          agentName: listingAgentName,
          role: 'listing',
          amount: totalServiceFee * this.SPLIT_AGENT_SHARE,
          percentage: 25,
        },
        {
          agentId: sellingAgentId.toString(),
          agentName: sellingAgentName,
          role: 'selling',
          amount: totalServiceFee * this.SPLIT_AGENT_SHARE,
          percentage: 25,
        },
      ],
      calculatedAt,
    };
  }
}
