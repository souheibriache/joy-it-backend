import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { SupportService } from './support.service'
import { PostQuestionVisitorDto } from './dto'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiTags } from '@nestjs/swagger'
import { MEDIA_TYPES } from '@app/upload/constants/file.types'

@Controller('support/visitor')
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
    return await this.supportService.postQuestionByVisitor(
      postQuestionVisitorDto,
    )
  }
}
