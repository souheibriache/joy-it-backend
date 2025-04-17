import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Faq } from './entities'
import { Repository } from 'typeorm'
import { CreateFaqDto, UpdateFaqDto } from './dto'

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    const faq = this.faqRepository.create(createFaqDto)
    return await this.faqRepository.save(faq)
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqRepository.findOne({ where: { id } })
    if (!faq) {
      throw new NotFoundException(`FAQ with id ${id} not found`)
    }
    Object.assign(faq, updateFaqDto)
    return await this.faqRepository.save(faq)
  }

  async getAll(): Promise<Faq[]> {
    return await this.faqRepository.find({ order: { createdAt: 'DESC' } })
  }

  async delete(id: string): Promise<{ message: string }> {
    const faq = await this.faqRepository.findOne({ where: { id } })
    if (!faq) {
      throw new NotFoundException(`FAQ with id ${id} not found`)
    }
    await this.faqRepository.remove(faq)
    return { message: 'FAQ deleted successfully' }
  }
}
