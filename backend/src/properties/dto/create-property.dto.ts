import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { PropertyType } from '../schemas/property.schema.js';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  readonly address: string;

  @IsString()
  @IsNotEmpty()
  readonly city: string;

  @IsString()
  @IsNotEmpty()
  readonly postcode: string;

  @IsEnum(PropertyType)
  readonly type: PropertyType;

  @IsNumber()
  @Min(0)
  readonly askingPrice: number;

  @IsString()
  @IsOptional()
  readonly description?: string;
}
