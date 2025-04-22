import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { NwesletterService } from './nwesletter.service'
import { NewsletterEmailDto, NewsletterOptionsDto } from './dto'
import { PageDto } from '@app/pagination/dto'
import { INewsLetter } from './interfaces/newsletter.interface'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { ApiTags } from '@nestjs/swagger'

@Controller('newsletter')
@ApiTags('newsletter')
export class NwesletterController {
  constructor(private readonly nwesletterService: NwesletterService) {}

  @Post()
  async create(@Body() createNewsLetterDto: NewsletterEmailDto) {
    return await this.nwesletterService.create(createNewsLetterDto)
  }

  @Get()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  async getPaginatedNewsletter(
    @Query() pageOptionsDto: NewsletterOptionsDto,
  ): Promise<PageDto<INewsLetter>> {
    return await this.nwesletterService.getPaginated(pageOptionsDto)
  }
}
