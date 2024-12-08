import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';
import { Company } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';
import { Client } from 'src/client/entities';
import { CompanyOptionsDto } from './dto/company-options.dto';
import { ICompany } from './interfaces';
import { PageDto, PageMetaDto } from '@app/pagination/dto';
import { CompanyFilterDto } from './dto/company-filter.dto';
import { Media } from '@app/media/entities';
import { CloudinaryResponse } from '@app/upload/types/cloudinary-response.type';
import { MediaService } from '@app/media';
import { ClientService } from 'src/client/client.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly mediaService: MediaService,
    private readonly clientService: ClientService,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    uploadedLogo: CloudinaryResponse,
    clientId: string,
  ) {
    const existingCompany = await this.companyRepository.findOne({
      where: { client: { id: clientId } },
    });
    if (existingCompany)
      throw new BadRequestException('Client already has a company!');

    const logo: Media = await this.mediaService.create({
      fullUrl: uploadedLogo.url,
      name: uploadedLogo.display_name,
      originalName: uploadedLogo.original_filename,
      placeHolder: createCompanyDto.name,
      resourceType: uploadedLogo.resource_type,
    });

    const client = await this.clientService.findOne({ id: clientId });

    const company = this.companyRepository.create({
      ...createCompanyDto,
      logo,
      client,
    });

    return await this.companyRepository.save(company);
  }

  async update(
    updateCompanyDto: UpdateCompanyDto,
    where: FindOptionsWhere<Company>,
  ) {
    const company = await this.findOne(where);

    await this.companyRepository.update(company.id, updateCompanyDto);

    return await this.findOne({ id: company.id });
  }

  async updateCompanyLogo(uploadedLogo: CloudinaryResponse, clientId: string) {
    const company = await this.findOne({ client: { id: clientId } });
    const logo: Media = await this.mediaService.create({
      fullUrl: uploadedLogo.url,
      name: uploadedLogo.display_name,
      originalName: uploadedLogo.original_filename,
      placeHolder: company.name,
      resourceType: uploadedLogo.resource_type,
    });

    company.logo = logo;
    return await company.save();
  }

  async find(
    where?: FindOptionsWhere<Company>,
    relations?: FindOptionsRelations<Company>,
    order?: FindOptionsOrder<Company>,
  ) {
    return await this.companyRepository.find({ where, relations, order });
  }

  async findOne(
    where?: FindOptionsWhere<Company>,
    relations?: FindOptionsRelations<Company>,
    order?: FindOptionsOrder<Company>,
  ) {
    const company = await this.companyRepository.findOne({
      where,
      relations,
      order,
    });
    if (!company) throw new NotFoundException('company not found!');

    return company;
  }

  async delete(id: string) {
    await this.findOne({ id });

    await this.companyRepository.delete(id);

    return true;
  }

  async getPaginatedCompanies(
    companyOptionsDto: CompanyOptionsDto,
  ): Promise<PageDto<ICompany>> {
    const where: FindOptionsWhere<Company> = {};

    return await this.queryCompanies(where, companyOptionsDto);
  }

  private async queryCompanies(
    where: FindOptionsWhere<Company>,
    companyOptionsDto: CompanyOptionsDto,
  ): Promise<PageDto<ICompany>> {
    const {
      sort,
      skip,
      take,
      query = {} as CompanyFilterDto,
    } = companyOptionsDto;
    const { name, isVerified } = query;

    if (name) where.name = ILike(`%${name}%`);

    if (isVerified === true || isVerified === false) {
      where.isVerified = isVerified;
    }

    const relations: FindOptionsRelations<Company> = {
      client: true,
      logo: true,
      subscription: { plan: true },
    };

    const [items, itemCount] = await this.companyRepository.findAndCount({
      where,
      skip,
      relations,
      take,
      order: {
        ...sort,
      },
    });

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: companyOptionsDto,
    });
    return new PageDto(items, pageMetaDto);
  }

  async verifyCompany(companyId: string) {
    const company = await this.findOne({ id: companyId });
    company.isVerified = true;
    return await company.save();
  }
}
