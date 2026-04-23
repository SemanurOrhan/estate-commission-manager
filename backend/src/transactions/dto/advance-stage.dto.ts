import { IsString, IsOptional } from 'class-validator';

export class AdvanceStageDto {
  @IsString()
  @IsOptional()
  readonly notes?: string;
}
