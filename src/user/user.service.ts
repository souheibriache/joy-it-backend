import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal server error!');
    }
  }

  async findAll(
    where?: FindOptionsWhere<User>,
    relations?: FindOptionsRelations<User>,
    order?: FindOptionsOrder<User>,
    select?: FindOptionsSelect<User>
  ) {
    return await this.userRepository.find({ where, relations, order, select });
  }

  async findOne(findOptions: {
    where?: FindOptionsWhere<User> | FindOptionsWhere<User>[];
    relations?: FindOptionsRelations<User>;
    order?: FindOptionsOrder<User>;
    select?: FindOptionsSelect<User>;
  }): Promise<IUser> {
    const { where, relations, order, select } = findOptions;
    return await this.userRepository.findOne({ where, relations, order, select });
  }

  async getOneById(id: string): Promise<IUser> {
    return await this.findOne({ where: { id } });
  }
}
