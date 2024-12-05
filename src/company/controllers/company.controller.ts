import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MEDIA_TYPES } from '@app/upload/constants/file.types';
import { UploadService } from '@app/upload';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { Client } from 'src/client/entities';
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto';
import { CompanyService } from '../company.service';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto';

@Controller('companies')
@ApiTags('Companies')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Request() req: IRequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), //? 10MO
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    const client = req.user;
    const uploadedFile = await this.uploadService.upload(file, 'companies');
    console.log({ uploadedFile });
    return await this.companyService.create(
      createCompanyDto,
      uploadedFile,
      client as Client,
    );
  }

  @Put()
  async update(
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: IRequestWithUser,
  ) {
    const clientId = req?.user?.id;
    return await this.companyService.update(updateCompanyDto, {
      client: { id: clientId },
    });
  }

  @Put('/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async updateLogo(
    @Request() req: IRequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), //? 10MO
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    const clientId = req?.user?.id;
    const uploadedFile = await this.uploadService.upload(file, 'companies');
    return await this.companyService.updateCompanyLogo(uploadedFile, clientId);
  }

  @Get('/my-company')
  async getClientCompany(@Request() req: IRequestWithUser) {
    const clientId = req?.user?.id;
    return await this.companyService.findOne(
      { client: { id: clientId } },
      { client: true, logo: true, subscription: true },
    );
  }
}
