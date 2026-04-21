import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from '../commission.service.js';
import { Types } from 'mongoose';

describe('CommissionService', () => {
  let service: CommissionService;

  const agentAId = new Types.ObjectId();
  const agentBId = new Types.ObjectId();
  const FEE = 10_000;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionService],
    }).compile();
    service = module.get<CommissionService>(CommissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Scenario 1 — Dual Agent', () => {
    it('should award the agency exactly 50% of the total fee (5000)', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentAId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Alice Smith',
      });
      expect(result.agencyAmount).toBe(5_000);
      expect(result.agencyPercentage).toBe(50);
    });

    it('should produce exactly one agent entry with role "dual" and amount 5000', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentAId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Alice Smith',
      });
      expect(result.agentEntries).toHaveLength(1);
      expect(result.agentEntries[0].role).toBe('dual');
      expect(result.agentEntries[0].amount).toBe(5_000);
      expect(result.agentEntries[0].percentage).toBe(50);
    });

    it('should ensure agency + agent amounts sum to the total fee', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentAId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Alice Smith',
      });
      const agentTotal = result.agentEntries.reduce((sum, e) => sum + e.amount, 0);
      expect(result.agencyAmount + agentTotal).toBe(FEE);
    });

    it('should set the correct agentId on the dual entry', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentAId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Alice Smith',
      });
      expect(result.agentEntries[0].agentId).toBe(agentAId.toString());
    });
  });

  describe('Scenario 2 — Split Agents', () => {
    it('should award the agency exactly 50% of the total fee (5000)', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentBId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      expect(result.agencyAmount).toBe(5_000);
    });

    it('should produce two agent entries each with amount 2500', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentBId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      expect(result.agentEntries).toHaveLength(2);
      result.agentEntries.forEach((entry) => {
        expect(entry.amount).toBe(2_500);
        expect(entry.percentage).toBe(25);
      });
    });

    it('should correctly assign "listing" and "selling" roles', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentBId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      const listing = result.agentEntries.find((e) => e.role === 'listing');
      const selling = result.agentEntries.find((e) => e.role === 'selling');
      expect(listing?.agentId).toBe(agentAId.toString());
      expect(listing?.agentName).toBe('Alice Smith');
      expect(selling?.agentId).toBe(agentBId.toString());
      expect(selling?.agentName).toBe('Bob Jones');
    });

    it('should ensure agency + both agents sum to the total fee', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentBId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      const agentTotal = result.agentEntries.reduce((sum, e) => sum + e.amount, 0);
      expect(result.agencyAmount + agentTotal).toBe(FEE);
    });
  });

  describe('Edge Cases', () => {
    it('should handle a zero service fee without throwing', () => {
      const result = service.calculate({
        totalServiceFee: 0,
        listingAgentId: agentAId,
        sellingAgentId: agentBId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      expect(result.agencyAmount).toBe(0);
      result.agentEntries.forEach((e) => expect(e.amount).toBe(0));
    });

    it('should handle a very large service fee correctly', () => {
      const largeFee = 1_000_000;
      const result = service.calculate({
        totalServiceFee: largeFee,
        listingAgentId: agentAId,
        sellingAgentId: agentBId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Bob Jones',
      });
      expect(result.agencyAmount).toBe(500_000);
      expect(result.agentEntries[0].amount).toBe(250_000);
      expect(result.agentEntries[1].amount).toBe(250_000);
    });

    it('should include a calculatedAt date in the result', () => {
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: agentAId,
        sellingAgentId: agentAId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Alice Smith',
      });
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    it('should correctly compare string-form ObjectIds for dual agent detection', () => {
      const idString = agentAId.toString();
      const result = service.calculate({
        totalServiceFee: FEE,
        listingAgentId: idString,
        sellingAgentId: agentAId,
        listingAgentName: 'Alice Smith',
        sellingAgentName: 'Alice Smith',
      });
      expect(result.agentEntries).toHaveLength(1);
      expect(result.agentEntries[0].role).toBe('dual');
    });
  });
});
