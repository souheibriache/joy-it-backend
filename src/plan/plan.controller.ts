import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { PlanService } from './plan.service'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { CreatePlanDto, UpdatePlanDto } from './dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@Controller('plans')
@ApiTags('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async create(@Body() createPlanDto: CreatePlanDto) {
    return await this.planService.create(createPlanDto)
  }

  @Put('/:planId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async update(@Body() updatePlanDto: UpdatePlanDto, @Param('planId') planId) {
    return await this.planService.update(planId, updatePlanDto)
  }

  @Get()
  async getAll() {
    return await this.planService.find({}, { activities: { images: true } })
  }

  @Get('/:planId')
  async getOne(@Param('planId') planId) {
    return await this.planService.findOne({ id: planId }, { activities: true })
  }

  @Delete('/:planId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async delete(@Param('planId') planId: string) {
    return await this.planService.delete(planId)
  }
}
