import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VouchersService } from './vouchers.service';
import { VouchersAdminController } from './vouchers-admin.controller';
import { VouchersUserController } from './vouchers-user.controller'; // Import user controller
import { Voucher, VoucherSchema } from './schemas/voucher.schema';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for guards
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voucher.name, schema: VoucherSchema },
      { name: User.name, schema: UserSchema }
    ]),
    AuthModule, // Import AuthModule to provide dependencies for JwtAuthGuard and JwtAdminAuthGuard
  ],
  controllers: [VouchersAdminController, VouchersUserController], // Add VouchersUserController
  providers: [VouchersService],
  exports: [VouchersService], // Export service if needed by other modules (e.g., OrdersModule)
})
export class VouchersModule {}
