import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Media } from './entities'
import { Repository } from 'typeorm'
import { CreateMediaDto } from './dto/create-media.dto'

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto)
    return await this.mediaRepository.save(media)
  }

  async delete(id: string) {
    const deletedItem = await this.mediaRepository.delete(id)
    if (deletedItem.affected < 1) {
      throw new NotFoundException('Media not found')
    }
    return true
  }
}
