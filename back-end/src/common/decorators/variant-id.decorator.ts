// back-end/src/common/decorators/variant-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const VariantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.params.variantId;
  },
);
