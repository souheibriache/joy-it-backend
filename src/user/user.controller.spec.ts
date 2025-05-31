import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserRoles } from './enums/user-roles.enum'

describe('UserController', () => {
  let controller: UserController
  let service: UserService

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
    service = module.get<UserService>(UserService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
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

    it('should create a new user', async () => {
      mockUserService.create.mockResolvedValue(mockUser)

      const result = await controller.create(createUserDto)

      expect(result).toEqual(mockUser)
      expect(service.create).toHaveBeenCalledWith(createUserDto)
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

    it('should return an array of users', async () => {
      mockUserService.findAll.mockResolvedValue(mockUsers)

      const result = await controller.findAll()

      expect(result).toEqual(mockUsers)
      expect(service.findAll).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      userName: 'testuser',
      role: UserRoles.CLIENT,
    }

    it('should return a user by id', async () => {
      mockUserService.getOneById.mockResolvedValue(mockUser)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(mockUser)
      expect(service.getOneById).toHaveBeenCalledWith('test-id')
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
      firstName: 'Updated',
      lastName: 'User',
      role: UserRoles.CLIENT,
    }

    it('should update a user', async () => {
      mockUserService.update.mockResolvedValue(mockUser)

      const result = await controller.update('test-id', updateUserDto)

      expect(result).toEqual(mockUser)
      expect(service.update).toHaveBeenCalledWith('test-id', updateUserDto)
    })
  })

  describe('remove', () => {
    it('should remove a user', async () => {
      const mockResult = { message: 'User deleted successfully' }
      mockUserService.remove.mockResolvedValue(mockResult)

      const result = await controller.remove('test-id')

      expect(result).toEqual(mockResult)
      expect(service.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
