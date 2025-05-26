import { Controller, Get, Param, Query } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchFilterDto } from './dto/branch-filter.dto';

@Controller('branches')
export class BranchesUserController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  async findAll(@Query() filterDto: BranchFilterDto) {
    return this.branchesService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }
}