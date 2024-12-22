import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Activity, ActivityImage } from './entities'
import {
  Brackets,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm'
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type'
import {
  ActivityFilterDto,
  ActivityOptionsDto,
  CreateActivityDto,
  updateActivityDto,
  UpdateActivityImagesDto,
  UpdateActivityMainImageDto,
} from './dto'
import { PageDto, PageMetaDto } from '@app/pagination/dto'
import { IActivity } from './interfaces'

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityImage)
    private readonly activityImageRepository: Repository<ActivityImage>,
  ) {}

  async create(
    createActivityDto: CreateActivityDto,
    uploadedFiles: CloudinaryResponse[],
  ) {
    const activity = this.activityRepository.create(createActivityDto)

    const savedActivity = await this.activityRepository.save(activity)

    savedActivity.images = []
    uploadedFiles.forEach(async (image, index) => {
      const activityImage = this.activityImageRepository.create({
        fullUrl: image.url,
        isMain: index === createActivityDto.mainImageIndex,
        activity: savedActivity,
        originalName: image.original_filename,
        name: image.display_name,
        placeHolder: image.placeholder,
        resourceType: image.resource_type,
      })
      const savedImage = await this.activityImageRepository.save(activityImage)

      savedActivity.images.push(savedImage)
    })

    return await savedActivity.save()
  }

  async find(
    where?: FindOptionsWhere<Activity>,
    relations?: FindOptionsRelations<Activity>,
    order?: FindOptionsOrder<Activity>,
  ) {
    return await this.activityRepository.find({ where, relations, order })
  }

  async findOne(
    where?: FindOptionsWhere<Activity>,
    relations?: FindOptionsRelations<Activity>,
    order?: FindOptionsOrder<Activity>,
  ) {
    const activity = await this.activityRepository.findOne({
      where,
      relations,
      order,
    })
    if (!activity) throw new NotFoundException('Activity not found!')

    return activity
  }

  async update(id: string, updateActivityDto: updateActivityDto) {
    await this.findOne({ id }, { images: true })

    await this.activityRepository.update(id, updateActivityDto)
    return await this.findOne({ id })
  }

  async updateMainImage(
    activityId: string,
    updateActivityMainImageDto: UpdateActivityMainImageDto,
  ) {
    const activityImage = await this.activityImageRepository.findOne({
      where: {
        id: updateActivityMainImageDto.imageId,
        activity: { id: activityId },
      },
    })
    if (!activityImage) throw new NotFoundException('Image not found')

    await this.activityImageRepository.update(
      { activity: { id: activityId } },
      { isMain: false },
    )
    activityImage.isMain = true
    await activityImage.save()
    return activityImage
  }

  async updateImages(
    id: string,
    updateActivityImagesDto: UpdateActivityImagesDto,
    uploadedFiles: CloudinaryResponse[],
  ) {
    const activity = await this.findOne({ id }, { images: true })

    // Ensure retainedImageIds is an array of strings
    const retainedImageIds = Array.isArray(
      updateActivityImagesDto.retainedImageIds,
    )
      ? updateActivityImagesDto.retainedImageIds
      : [updateActivityImagesDto.retainedImageIds].filter(Boolean)

    const retainedImages = activity?.images.filter((image) =>
      retainedImageIds.includes(image.id),
    )

    const imagesToDelete = activity.images.filter(
      (image) => !retainedImageIds.includes(image.id),
    )
    await this.activityImageRepository.remove(imagesToDelete)

    const newImages = uploadedFiles.map((image) =>
      this.activityImageRepository.create({
        fullUrl: image.url,
        isMain: false,
        activity: activity,
        originalName: image.original_filename,
        name: image.display_name,
        placeHolder: image.placeholder,
        resourceType: image.resource_type,
      }),
    )

    const allImages = [...retainedImages, ...newImages]

    allImages.forEach((image, index) => {
      image.isMain = index === updateActivityImagesDto.mainImageIndex
    })

    if (newImages.length > 0) {
      await this.activityImageRepository.save(newImages)
    }

    activity.images = allImages

    return await activity.save()
  }

  async delete(id: string) {
    await this.findOne({ id })

    await this.activityRepository.delete(id)

    return true
  }

  async deleteImage(id: string, imageId: string) {
    await this.findOne({ id, images: { id: imageId } })

    await this.activityImageRepository.delete(imageId)

    return true
  }

  async getPaginatedActivities(
    activityOptionsDto: ActivityOptionsDto,
  ): Promise<PageDto<IActivity>> {
    const where: FindOptionsWhere<Activity> = {}

    return await this.queryActivities(where, activityOptionsDto)
  }

  private async queryActivities(
    where: FindOptionsWhere<Activity>,
    activityOptionsDto: ActivityOptionsDto,
  ): Promise<PageDto<IActivity>> {
    const {
      sort,
      skip,
      take,
      query = {} as ActivityFilterDto,
    } = activityOptionsDto
    const { search, types, isAvailable, durationMax, durationMin } = query

    const queryBuilder = this.activityRepository.createQueryBuilder('activity')

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('activity.name ILIKE :search', { search: `%${search}%` })
            .orWhere('activity.city ILIKE :search', { search: `%${search}%` })
            .orWhere('activity.address ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('activity.postalCode ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere(':search ILIKE ANY(activity.keyWords)', {
              search: `%${search}%`,
            })
        }),
      )
    }

    if (types) {
      queryBuilder.andWhere('activity.types && :types', { types })
    }

    if (isAvailable === true || isAvailable === false) {
      queryBuilder.andWhere('activity.isAvailable = :isAvailable', {
        isAvailable,
      })
    }

    if (durationMin !== undefined) {
      queryBuilder.andWhere('activity.duration >= :durationMin', {
        durationMin,
      })
    }

    if (durationMax !== undefined) {
      queryBuilder.andWhere('activity.duration <= :durationMax', {
        durationMax,
      })
    }

    queryBuilder.leftJoinAndSelect('activity.images', 'images')

    if (sort) {
      Object.entries(sort).forEach(([field, order]) => {
        queryBuilder.addOrderBy(`activity.${field}`, order as 'ASC' | 'DESC')
      })
    }

    queryBuilder.skip(skip).take(take)

    const [items, itemCount] = await queryBuilder.getManyAndCount()

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: activityOptionsDto,
    })
    return new PageDto(items, pageMetaDto)
  }
}
