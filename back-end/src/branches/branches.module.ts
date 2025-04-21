import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchesService } from './branches.service';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { BranchesAdminController } from './branches-admin.controller';
import { BranchesUserController } from './branches-user.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
    ]),
    ProductsModule
  ],
  controllers: [BranchesAdminController, BranchesUserController],
  providers: [BranchesService],
  exports: [
    BranchesService,
    MongooseModule // Export MongooseModule to make BranchModel available
  ]
})
export class BranchesModule {}
