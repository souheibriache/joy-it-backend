import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Put,
  Query,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { SupportService } from './support.service'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { Support } from './entities'
import { AnswerSupportQuestionDto, SupportOptionsDto } from './dto'
import { ISupport } from './interfaces/support.interface'
import { FilesInterceptor } from '@nestjs/platform-express'
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard'
import { SuperUserGuard } from 'src/auth/guards/super-user.guard'
import { UserService } from 'src/user/user.service'
import { ApiPaginatedResponse } from '@app/pagination/decorators'
import { PageDto } from '@app/pagination/dto'
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto'
import { MEDIA_TYPES } from '@app/upload/constants/file.types'
import { Response } from 'express'

@Controller('admin/support')
@ApiTags('support/admin')
@UseGuards(AccessTokenGuard, SuperUserGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly usersService: UserService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiPaginatedResponse(Support)
  async getAllSupportQuestions(
    @Query() supportOptionsDto: SupportOptionsDto,
  ): Promise<PageDto<Support>> {
    return await this.supportService.getAllSupports(supportOptionsDto)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<ISupport> {
    return await this.supportService.getSupportById(id)
  }

  @Put('/:id/answer')
  @UseInterceptors(FilesInterceptor('attachments'))
  @ApiConsumes('multipart/form-data')
  async answerSupportQuestion(
    @Request() req: IRequestWithUser,
    @Body() answerSupportQuestionDto: AnswerSupportQuestionDto,
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE_PDF }),
        ],
        fileIsRequired: false,
      }),
    )
    attachments?: Array<Express.Multer.File>,
  ): Promise<ISupport> {
    const adminId = req?.user?.id
    const answeredBy = await this.usersService.findOne({
      where: { id: adminId },
    })
    answerSupportQuestionDto.attachments = attachments
    return await this.supportService.answerSupportQuestion(
      id,
      answerSupportQuestionDto,
      answeredBy,
    )
  }

  @Get(':id/:attachmentType')
  async downloadAllAttachments(
    @Param('id') id: string,
    @Param('attachmentType')
    attachmentType: 'question' | 'answer' | 'all' = 'all',
    @Res() res: Response,
  ) {
    const { stream, fileName } =
      await this.supportService.downloadAllAttachments(id)
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    })
    stream.pipe(res)
  }
}
