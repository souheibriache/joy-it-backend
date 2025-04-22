import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { SupportService } from './support.service'
import { PostQuestionVisitorDto } from './dto'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiTags } from '@nestjs/swagger'
import { MEDIA_TYPES } from '@app/upload/constants/file.types'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { PostQuestionUserDto } from './dto/post-question-user.dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'

@Controller('support')
@ApiTags('Support/visitor')
export class SupportVisitorController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('questionAttachments'))
  @ApiConsumes('multipart/form-data')
  async postQuestion(
    @Body() postQuestionVisitorDto: PostQuestionVisitorDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE_PDF }),
        ],
        fileIsRequired: false,
      }),
    )
    questionAttachments?: Array<Express.Multer.File>,
  ) {
    postQuestionVisitorDto.questionAttachments = questionAttachments
    return await this.supportService.postQuestion(postQuestionVisitorDto)
  }

  @Post('/user')
  @UseInterceptors(FilesInterceptor('questionAttachments'))
  @UseGuards(AccessTokenGuard)
  @ApiConsumes('multipart/form-data')
  async postUserQuestion(
    @Body() postQuestionVisitorDto: PostQuestionUserDto,
    @Request() req: IRequestWithUser,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE_PDF }),
        ],
        fileIsRequired: false,
      }),
    )
    questionAttachments?: Array<Express.Multer.File>,
  ) {
    const userId = req?.user?.id
    postQuestionVisitorDto.questionAttachments = questionAttachments
    return await this.supportService.postQuestionByUser(
      postQuestionVisitorDto,
      userId,
    )
  }
}
