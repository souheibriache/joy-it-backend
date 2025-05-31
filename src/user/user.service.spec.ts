import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from './entities'
import { Repository, FindOptionsRelations, FindOptionsOrder } from 'typeorm'
import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserRoles } from './enums/user-roles.enum'

describe('UserService', () => {
  let service: UserService
  let repository: Repository<User>

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    repository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      userName: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'testpassword',
    }

    const mockUser = {
      id: 'test-id',
      ...createUserDto,
      role: UserRoles.CLIENT,
      isVerified: false,
      isSuperUser: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should successfully create a user', async () => {
      mockUserRepository.create.mockReturnValue(mockUser)
      mockUserRepository.save.mockResolvedValue(mockUser)

      const result = await service.create(createUserDto)

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto)
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser)
    })

    it('should throw InternalServerErrorException on save error', async () => {
      mockUserRepository.create.mockReturnValue(mockUser)
      mockUserRepository.save.mockRejectedValue(new Error('Database error'))

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      )
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto)
    })
  })

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        userName: 'user1',
        role: UserRoles.CLIENT,
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        userName: 'user2',
        role: UserRoles.ADMIN,
      },
    ]

    it('should return all users with no parameters', async () => {
      mockUserRepository.find.mockResolvedValue(mockUsers)

      const result = await service.findAll()

      expect(result).toEqual(mockUsers)
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: undefined,
        relations: undefined,
        order: undefined,
        select: undefined,
      })
    })

    it('should return filtered users with parameters', async () => {
      const where = { role: UserRoles.CLIENT }
      const relations: FindOptionsRelations<User> = {
        refreshTokens: true,
        articles: true,
      }
      const order: FindOptionsOrder<User> = { createdAt: 'DESC' }
      const select = { id: true, email: true }

      mockUserRepository.find.mockResolvedValue([mockUsers[0]])

      const result = await service.findAll(where, relations, order, select)

      expect(result).toEqual([mockUsers[0]])
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where,
        relations,
        order,
        select,
      })
    })
  })

  describe('findOne', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      userName: 'testuser',
      role: UserRoles.CLIENT,
    }

    it('should return a user when found', async () => {
      const findOptions = {
        where: { id: 'test-id' },
        relations: {
          refreshTokens: true,
          articles: true,
        } as FindOptionsRelations<User>,
        select: { id: true, email: true },
      }

      mockUserRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.findOne(findOptions)

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(findOptions)
    })

    it('should throw NotFoundException when user not found', async () => {
      const findOptions = { where: { id: 'non-existent-id' } }

      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(findOptions)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(findOptions)
    })

    it('should handle multiple where conditions', async () => {
      const findOptions = {
        where: [{ email: 'test@example.com' }, { userName: 'testuser' }],
      }

      mockUserRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.findOne(findOptions)

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(findOptions)
    })
  })

  describe('getOneById', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      userName: 'testuser',
      role: UserRoles.CLIENT,
    }

    it('should return a user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.getOneById('test-id')

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
    })

    it('should throw NotFoundException when user not found by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.getOneById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      })
    })
  })

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'User',
    }

    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      userName: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: UserRoles.CLIENT,
    }

    const mockUpdatedUser = {
      ...mockUser,
      ...updateUserDto,
    }

    it('should update a user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser)
      mockUserRepository.merge.mockReturnValue(mockUpdatedUser)
      mockUserRepository.save.mockResolvedValue(mockUpdatedUser)

      const result = await service.update('test-id', updateUserDto)

      expect(result).toEqual(mockUpdatedUser)
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
      expect(mockUserRepository.merge).toHaveBeenCalledWith(
        mockUser,
        updateUserDto,
      )
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUpdatedUser)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(
        service.update('non-existent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw InternalServerErrorException on save error', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser)
      mockUserRepository.merge.mockReturnValue(mockUpdatedUser)
      mockUserRepository.save.mockRejectedValue(new Error('Database error'))

      await expect(service.update('test-id', updateUserDto)).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })

  describe('remove', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      userName: 'testuser',
      role: UserRoles.CLIENT,
    }

    it('should remove a user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser)
      mockUserRepository.remove.mockResolvedValue(mockUser)

      const result = await service.remove('test-id')

      expect(result).toEqual({ message: 'User deleted successfully' })
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw InternalServerErrorException on remove error', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser)
      mockUserRepository.remove.mockRejectedValue(new Error('Database error'))

      await expect(service.remove('test-id')).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })
})
