import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { FaqService } from './faq.service'
import { CreateFaqDto, UpdateFaqDto } from './dto'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async createFaq(@Body() createFaqDto: CreateFaqDto) {
    return await this.faqService.create(createFaqDto)
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async updateFaq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFaqDto: UpdateFaqDto,
  ) {
    return await this.faqService.update(id, updateFaqDto)
  }

  @Get()
  async getAllFaqs() {
    return await this.faqService.getAll()
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async deleteFaq(@Param('id', ParseUUIDPipe) id: string) {
    return await this.faqService.delete(id)
  }
}
