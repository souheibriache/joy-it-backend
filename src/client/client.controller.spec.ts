import { Test, TestingModule } from '@nestjs/testing'
import { ClientController } from './client.controller'
import { ClientService } from './client.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { UserRoles } from 'src/user/enums/user-roles.enum'

describe('ClientController', () => {
  let controller: ClientController
  let service: ClientService

  const mockClientService = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    isVerified: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile()

    controller = module.get<ClientController>(ClientController)
    service = module.get<ClientService>(ClientService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    const createClientDto: CreateClientDto = {
      email: 'client@example.com',
      userName: 'clientuser',
      firstName: 'Client',
      lastName: 'User',
      password: 'clientpass',
    }

    const mockClient = {
      id: 'client-id',
      ...createClientDto,
      role: UserRoles.CLIENT,
      isVerified: false,
      verificationSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a new client', async () => {
      mockClientService.create.mockResolvedValue(mockClient)

      const result = await controller.create(createClientDto)

      expect(result).toEqual(mockClient)
      expect(service.create).toHaveBeenCalledWith(createClientDto)
    })
  })

  describe('findAll', () => {
    const mockClients = [
      {
        id: 'client-1',
        email: 'client1@example.com',
        userName: 'client1',
        role: UserRoles.CLIENT,
        isVerified: true,
      },
      {
        id: 'client-2',
        email: 'client2@example.com',
        userName: 'client2',
        role: UserRoles.CLIENT,
        isVerified: false,
      },
    ]

    it('should return an array of clients', async () => {
      mockClientService.find.mockResolvedValue(mockClients)

      const result = await controller.findAll()

      expect(result).toEqual(mockClients)
      expect(service.find).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    const mockClient = {
      id: 'client-id',
      email: 'client@example.com',
      userName: 'clientuser',
      role: UserRoles.CLIENT,
      isVerified: true,
    }

    it('should return a client by id', async () => {
      mockClientService.findOne.mockResolvedValue(mockClient)

      const result = await controller.findOne('client-id')

      expect(result).toEqual(mockClient)
      expect(service.findOne).toHaveBeenCalledWith({ id: 'client-id' })
    })
  })

  describe('update', () => {
    const updateClientDto: UpdateClientDto = {
      userName: 'updateduser',
      firstName: 'Updated',
      lastName: 'Client',
    }

    const mockClient = {
      id: 'client-id',
      email: 'client@example.com',
      userName: 'updateduser',
      firstName: 'Updated',
      lastName: 'Client',
      role: UserRoles.CLIENT,
      isVerified: true,
    }

    it('should update a client', async () => {
      mockClientService.update.mockResolvedValue(mockClient)

      const result = await controller.update('client-id', updateClientDto)

      expect(result).toEqual(mockClient)
      expect(service.update).toHaveBeenCalledWith('client-id', updateClientDto)
    })
  })

  describe('isVerified', () => {
    it('should return verification status', async () => {
      mockClientService.isVerified.mockResolvedValue(true)

      const result = await controller.isVerified('client-id')

      expect(result).toBe(true)
      expect(service.isVerified).toHaveBeenCalledWith('client-id')
    })
  })
})
