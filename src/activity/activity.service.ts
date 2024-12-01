import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity, ActivityImage } from './entities';
import {
  Brackets,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type';
import {
  ActivityFilterDto,
  ActivityOptionsDto,
  CreateActivityDto,
  updateActivityDto,
  UpdateActivityImagesDto,
  UpdateActivityMainImageDto,
} from './dto';
import { PageDto, PageMetaDto } from '@app/pagination/dto';
import { IActivity } from './interfaces';

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
    const activity = this.activityRepository.create(createActivityDto);

    const savedActivity = await this.activityRepository.save(activity);

    savedActivity.images = [];
    uploadedFiles.forEach(async (image, index) => {
      const activityImage = this.activityImageRepository.create({
        fullUrl: image.url,
        isMain: index === createActivityDto.mainImageIndex,
        activity: savedActivity,
        originalName: image.original_filename,
        name: image.name,
        placeHolder: image.placeholder,
        resourceType: image.resource_type,
      });
      const savedImage = await this.activityImageRepository.save(activityImage);

      savedActivity.images.push(savedImage);
    });

    return await savedActivity.save();
  }

  async find(
    where?: FindOptionsWhere<Activity>,
    relations?: FindOptionsRelations<Activity>,
    order?: FindOptionsOrder<Activity>,
  ) {
    return await this.activityImageRepository.find({ where, relations, order });
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
    });
    if (!activity) throw new NotFoundException('Activity not found!');

    return activity;
  }

  async update(id: string, updateActivityDto: updateActivityDto) {
    await this.findOne({ id }, { images: true });

    await this.activityRepository.update(id, updateActivityDto);
    return await this.findOne({ id });
  }

  async updateMainImage(
    activityId: string,
    updateActivityMainImageDto: UpdateActivityMainImageDto,
  ) {
    const activity = await this.findOne({ id: activityId });

    const activityImage = await this.activityImageRepository.findOne({
      where: {
        id: updateActivityMainImageDto.imageId,
        activity: { id: activityId },
      },
    });
    if (!activityImage) throw new NotFoundException('Image not found');

    await this.activityImageRepository.update(
      { activity: { id: activityId } },
      { isMain: false },
    );
    activityImage.isMain = true;
    await activityImage.save();
    return activityImage;
  }

  async updateImages(
    id: string,
    updateActivityImagesDto: UpdateActivityImagesDto,
    uploadedFiles: CloudinaryResponse[],
  ) {
    const activity = await this.findOne({ id });

    activity.images = [];
    uploadedFiles.forEach(async (image, index) => {
      const activityImage = this.activityImageRepository.create({
        fullUrl: image.url,
        isMain: index === updateActivityImagesDto.mainImageIndex,
        activity: activity,
        originalName: image.original_filename,
        name: image.name,
        placeHolder: image.placeholder,
        resourceType: image.resource_type,
      });
      const savedImage = await this.activityImageRepository.save(activityImage);
      activity.images.push(savedImage);
    });

    return await activity.save();
  }

  async delete(id: string) {
    await this.findOne({ id });

    await this.activityImageRepository.delete(id);

    return true;
  }

  async getPaginatedActivities(
    activityOptionsDto: ActivityOptionsDto,
  ): Promise<PageDto<IActivity>> {
    const where: FindOptionsWhere<Activity> = {};

    return await this.queryActivities(where, activityOptionsDto);
  }

  private async queryActivities(
    where: FindOptionsWhere<Activity>,
    productOptionsDto: ActivityOptionsDto,
  ): Promise<PageDto<IActivity>> {
    const {
      sort,
      skip,
      take,
      query = {} as ActivityFilterDto,
    } = productOptionsDto;
    const { search, types, isAvailable, durationMax, durationMin } = query;

    // Create a query builder
    const queryBuilder = this.activityRepository.createQueryBuilder('activity');

    // Handle search condition (match name, keyWords, city, address, postalCode)
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
            .orWhere(':search = ANY(activity.keyWords)', { search });
        }),
      );
    }

    // Handle types condition
    if (types) {
      queryBuilder.andWhere('activity.types && :types', { types });
    }

    // Handle isAvailable condition
    if (isAvailable === true || isAvailable === false) {
      queryBuilder.andWhere('activity.isAvailable = :isAvailable', {
        isAvailable,
      });
    }

    // Handle durationMin and durationMax
    if (durationMin !== undefined) {
      queryBuilder.andWhere('activity.duration >= :durationMin', {
        durationMin,
      });
    }
    if (durationMax !== undefined) {
      queryBuilder.andWhere('activity.duration <= :durationMax', {
        durationMax,
      });
    }

    // Add relations
    queryBuilder.leftJoinAndSelect('activity.images', 'images');

    // Add sorting
    if (sort) {
      Object.entries(sort).forEach(([field, order]) => {
        queryBuilder.addOrderBy(`activity.${field}`, order as 'ASC' | 'DESC');
      });
    }

    // Pagination
    queryBuilder.skip(skip).take(take);

    // Execute query
    const [items, itemCount] = await queryBuilder.getManyAndCount();

    // Generate pagination metadata
    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: productOptionsDto,
    });
    return new PageDto(items, pageMetaDto);
  }
}
