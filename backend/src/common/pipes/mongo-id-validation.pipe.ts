import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MongoIdValidationPipe implements PipeTransform<string> {
  transform(value: string): string {
    const trimmed = value.trim();
    if (!Types.ObjectId.isValid(trimmed)) {
      throw new BadRequestException(
        `"${trimmed}" is not a valid MongoDB ObjectId`,
      );
    }
    return trimmed;
  }
}
