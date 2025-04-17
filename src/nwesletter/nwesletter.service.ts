import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Newsletter } from './entities'
import { FindOptionsWhere, ILike, Repository } from 'typeorm'
import {
  NewsletterEmailDto,
  NewsletterFilterDto,
  NewsletterOptionsDto,
} from './dto'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { INewsLetter } from './interfaces/newsletter.interface'

@Injectable()
export class NwesletterService {
  constructor(
    @InjectRepository(Newsletter)
    private readonly newsletterRepository: Repository<Newsletter>,
  ) {}

  async create(newsletterEmailDto: NewsletterEmailDto) {
    let { email } = newsletterEmailDto
    email = email.trim().toLowerCase()

    const existingEmail = await this.newsletterRepository.findOne({
      where: { email },
    })

    if (existingEmail) return existingEmail

    const savedEmail = await this.newsletterRepository.create({
      email: email.trim().toLowerCase(),
    })
    return await this.newsletterRepository.save(savedEmail)
  }

  async getPaginated(
    newsletterOptionsDto: NewsletterOptionsDto,
  ): Promise<PageDto<Newsletter>> {
    const where: FindOptionsWhere<Newsletter> = {}

    return await this.queryNewsletter(where, newsletterOptionsDto)
  }

  private async queryNewsletter(
    where: FindOptionsWhere<Newsletter>,
    newsletterOptionsDto: NewsletterOptionsDto,
  ): Promise<PageDto<INewsLetter>> {
    const { sort, skip, take, search = '' as string } = newsletterOptionsDto

    const whereClause: FindOptionsWhere<Newsletter> = {}

    if (search && search.trim().length > 0) {
      whereClause.email = ILike(`%${search.trim()}%`)
    }

    const [items, itemCount] = await this.newsletterRepository.findAndCount({
      where: whereClause,
      order: sort,
      take,
      skip,
    })

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: newsletterOptionsDto,
    })
    return new PageDto(items, pageMetaDto)
  }
}
