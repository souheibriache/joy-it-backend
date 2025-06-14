import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from './entities'
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
} from 'typeorm'
import { IUser } from './interfaces/user.interface'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create(createUserDto)
      return await this.userRepository.save(user)
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Internal server error!')
    }
  }

  async findAll(
    where?: FindOptionsWhere<User>,
    relations?: FindOptionsRelations<User>,
    order?: FindOptionsOrder<User>,
    select?: FindOptionsSelect<User>,
  ) {
    return await this.userRepository.find({ where, relations, order, select })
  }

  async findOne(findOptions: {
    where?: FindOptionsWhere<User> | FindOptionsWhere<User>[]
    relations?: FindOptionsRelations<User>
    order?: FindOptionsOrder<User>
    select?: FindOptionsSelect<User>
  }): Promise<IUser> {
    const { where, relations, order, select } = findOptions
    const user = await this.userRepository.findOne({
      where,
      relations,
      order,
      select,
    })
    if (!user) throw new NotFoundException('User not found')

    return user
  }

  async getOneById(id: string): Promise<IUser> {
    return await this.findOne({ where: { id } })
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    const user = await this.getOneById(id)

    try {
      const updatedUser = this.userRepository.merge(user, updateUserDto)
      return await this.userRepository.save(updatedUser)
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Failed to update user')
    }
  }

  async remove(id: string) {
    const user = await this.getOneById(id)

    try {
      await this.userRepository.remove(user)
      return { message: 'User deleted successfully' }
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Failed to delete user')
    }
  }
}
