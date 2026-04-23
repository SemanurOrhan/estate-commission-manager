import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  readonly propertyId: string;

  @IsNumber()
  @Min(0)
  readonly agreedPrice: number;

  @IsNumber()
  @Min(0)
  readonly totalServiceFee: number;

  @IsMongoId()
  readonly listingAgentId: string;

  @IsMongoId()
  readonly sellingAgentId: string;

  @IsString()
  @IsOptional()
  readonly buyerName?: string;

  @IsString()
  @IsOptional()
  readonly buyerEmail?: string;
}
