import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const client = this.clientRepository.create(createClientDto);

    return await this.clientRepository.save(client);
  }

  async find(
    where?: FindOptionsWhere<Client>,
    relations?: FindOptionsRelations<Client>,
    order?: FindOptionsOrder<Client>,
  ) {
    return await this.clientRepository.find({ where, relations, order });
  }

  async findOne(
    where?: FindOptionsWhere<Client>,
    relations?: FindOptionsRelations<Client>,
    order?: FindOptionsOrder<Client>,
  ) {
    const client = await this.clientRepository.findOne({
      where,
      relations,
      order,
    });
    if (!client) throw new NotFoundException('Client not found!');

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne({ id });

    await this.clientRepository.update(id, updateClientDto);
    return await this.findOne({ id });
  }
}
