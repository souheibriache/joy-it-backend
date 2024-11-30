import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';
import { Company } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCompanyDto } from './dto';
import { Client } from 'src/client/entities';
import { CompanyOptionsDto } from './dto/company-options.dto';
import { ICompany } from './interfaces';
import { PageDto, PageMetaDto } from '@app/pagination/dto';
import { CompanyFilterDto } from './dto/company-filter.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, client: Client) {
    const company = this.companyRepository.create({
      ...createCompanyDto,
      client,
    });

    return await this.companyRepository.save(company);
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

    const relations: FindOptionsRelations<Company> = { client: true };

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
}
