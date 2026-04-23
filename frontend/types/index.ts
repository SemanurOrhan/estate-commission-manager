// ── Transaction Stage Enum ──────────────────────────────────────────
export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}

// ── Property Type Enum ──────────────────────────────────────────────
export enum PropertyType {
  SALE = 'sale',
  RENTAL = 'rental',
}

// ── Agent ───────────────────────────────────────────────────────────
export interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Property ────────────────────────────────────────────────────────
export interface Property {
  _id: string;
  address: string;
  city: string;
  postcode: string;
  type: PropertyType;
  askingPrice: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Commission Sub-documents ────────────────────────────────────────
export interface AgentCommissionEntry {
  agentId: string;
  agentName: string;
  role: 'listing' | 'selling' | 'dual';
  amount: number;
  percentage: number;
}

export interface CommissionBreakdown {
  totalServiceFee: number;
  agencyAmount: number;
  agencyPercentage: number;
  agentEntries: AgentCommissionEntry[];
  calculatedAt: string;
}

// ── Stage History ───────────────────────────────────────────────────
export interface StageHistoryEntry {
  stage: string;
  timestamp: string;
  notes?: string;
}

// ── Transaction ─────────────────────────────────────────────────────
export interface Transaction {
  _id: string;
  propertyId: string | Property;
  agreedPrice: number;
  totalServiceFee: number;
  stage: TransactionStage;
  listingAgentId: string | Agent;
  sellingAgentId: string | Agent;
  buyerName?: string;
  buyerEmail?: string;
  stageHistory: StageHistoryEntry[];
  commissionBreakdown: CommissionBreakdown | null;
  createdAt: string;
  updatedAt: string;
}

// ── API Envelope ─────────────
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

// ── Create Payloads ─────────────
export interface CreateTransactionPayload {
  propertyId: string;
  agreedPrice: number;
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
  buyerName?: string;
  buyerEmail?: string;
}

