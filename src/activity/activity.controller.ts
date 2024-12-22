import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ActivityService } from './activity.service'
import { UploadService } from '@app/upload'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import {
  ActivityOptionsDto,
  CreateActivityDto,
  updateActivityDto,
  UpdateActivityImagesDto,
  UpdateActivityMainImageDto,
} from './dto'
import { MEDIA_TYPES } from '@app/upload/constants/file.types'
import { PageDto } from '@app/pagination/dto'
import { IActivity } from './interfaces'

@Controller('activities')
@ApiTags('activities')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  async create(
    @Body() createActivityDto: CreateActivityDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), //? 10MO
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
  ) {
    const uploadedFiles = await this.uploadService.uploadMany(
      files,
      'activities',
    )
    return await this.activityService.create(createActivityDto, uploadedFiles)
  }

  @Put(':activityId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async update(
    @Body() updateActivityDto: updateActivityDto,
    @Param('activityId') activityId: string,
  ) {
    return await this.activityService.update(activityId, updateActivityDto)
  }

  @Put(':activityId/main-image')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async updateMainImage(
    @Body() UpdateActivityMainImageDto: UpdateActivityMainImageDto,
    @Param('activityId') activityId: string,
  ) {
    return await this.activityService.updateMainImage(
      activityId,
      UpdateActivityMainImageDto,
    )
  }

  @Put(':activityId/images')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  async updateActivityImages(
    @Param('activityId') activityId: string,
    @Body() updateActivityImagesDto: UpdateActivityImagesDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), //? 10MO
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files) return
    const uploadedFiles = await this.uploadService.uploadMany(
      files,
      'activities',
    )
    return await this.activityService.updateImages(
      activityId,
      updateActivityImagesDto,
      uploadedFiles,
    )
  }

  @Delete(':activityId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async delet(@Param('activityId') activityId: string) {
    return await this.activityService.delete(activityId)
  }

  @Delete(':activityId/:imageId')
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async deleteImage(
    @Param('activityId') activityId: string,
    @Param('imageId') imageId: string,
  ) {
    return await this.activityService.deleteImage(activityId, imageId)
  }

  @Get(':activityId')
  async findOneById(@Param('activityId') activityId: string) {
    return await this.activityService.findOne(
      { id: activityId },
      { images: true },
    )
  }

  @Get()
  async getPaginatedActivities(
    @Query() pageOptionsDto: ActivityOptionsDto,
  ): Promise<PageDto<IActivity>> {
    return await this.activityService.getPaginatedActivities(pageOptionsDto)
  }
}
