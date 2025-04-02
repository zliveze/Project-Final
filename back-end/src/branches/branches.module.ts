import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchesService } from './branches.service';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { BranchesAdminController } from './branches-admin.controller';
import { BranchesUserController } from './branches-user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Branch.name, schema: BranchSchema }]),
  ],
  controllers: [BranchesAdminController, BranchesUserController],
  providers: [BranchesService],
  exports: [BranchesService]
})
export class BranchesModule {} 