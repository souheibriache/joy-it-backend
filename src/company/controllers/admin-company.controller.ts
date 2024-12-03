import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from '../company.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { SuperUserGuard } from 'src/auth/guards/super-user.guard';
import { CompanyOptionsDto, UpdateCompanyDto } from '../dto';
import { ICompany } from '../interfaces';
import { PageDto } from '@app/pagination/dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('admin/company')
@UseGuards(AccessTokenGuard, SuperUserGuard)
@ApiBearerAuth()
export class CompanyAdminController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getPaginatedCompanies(
    @Query() pageOptionsDto: CompanyOptionsDto,
  ): Promise<PageDto<ICompany>> {
    return await this.companyService.getPaginatedCompanies(pageOptionsDto);
  }

  @Get(':companyId')
  async getCompanyById(@Param('companyId') companyId: string) {
    return await this.companyService.findOne(
      { id: companyId },
      { client: true, logo: true, subscription: true },
    );
  }

  @Put(':companyId/verify')
  async verifyCompany(@Param('companyId') companyId: string) {
    return await this.companyService.verifyCompany(companyId);
  }

  @Put(':companyId')
  async updateCompanyByAdmin(
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Param('companyId') companyId: string,
  ) {
    return await this.companyService.update(updateCompanyDto, {
      id: companyId,
    });
  }
}
