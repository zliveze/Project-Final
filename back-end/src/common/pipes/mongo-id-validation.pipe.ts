// back-end/src/common/pipes/mongo-id-validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MongoIdValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!Types.ObjectId.isValid(value)) {
      // Provide more context in the error message
      throw new BadRequestException(`Giá trị '${value}' cho tham số '${metadata.data}' không phải là một Mongo ID hợp lệ.`);
    }
    return value; // Return the original value if valid
  }
}
