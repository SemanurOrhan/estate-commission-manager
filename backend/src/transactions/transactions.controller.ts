import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { AdvanceStageDto } from './dto/advance-stage.dto.js';
import { MongoIdValidationPipe } from '../common/pipes/mongo-id-validation.pipe.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/advance')
  async advanceStage(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() advanceStageDto: AdvanceStageDto,
  ) {
    return this.transactionsService.advanceStage(id, advanceStageDto.notes);
  }
}

