import { Test, TestingModule } from '@nestjs/testing'
import { ClientService } from './client.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Client } from './entities'
import { Repository, FindOptionsRelations, FindOptionsOrder } from 'typeorm'
import { NotFoundException } from '@nestjs/common'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { UserRoles } from 'src/user/enums/user-roles.enum'

describe('ClientService', () => {
  let service: ClientService
  let repository: Repository<Client>

  const mockClientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
      ],
    }).compile()

    service = module.get<ClientService>(ClientService)
    repository = module.get<Repository<Client>>(getRepositoryToken(Client))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
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
      mockClientRepository.create.mockReturnValue(mockClient)
      mockClientRepository.save.mockResolvedValue(mockClient)

      const result = await service.create(createClientDto)

      expect(result).toEqual(mockClient)
      expect(mockClientRepository.create).toHaveBeenCalledWith(createClientDto)
      expect(mockClientRepository.save).toHaveBeenCalledWith(mockClient)
    })
  })

  describe('find', () => {
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

    it('should return all clients with no parameters', async () => {
      mockClientRepository.find.mockResolvedValue(mockClients)

      const result = await service.find()

      expect(result).toEqual(mockClients)
      expect(mockClientRepository.find).toHaveBeenCalledWith({
        where: undefined,
        relations: undefined,
        order: undefined,
      })
    })

    it('should return filtered clients with parameters', async () => {
      const where = { isVerified: true }
      const relations: FindOptionsRelations<Client> = {
        company: true,
      }
      const order: FindOptionsOrder<Client> = { createdAt: 'ASC' }

      mockClientRepository.find.mockResolvedValue([mockClients[0]])

      const result = await service.find(where, relations, order)

      expect(result).toEqual([mockClients[0]])
      expect(mockClientRepository.find).toHaveBeenCalledWith({
        where,
        relations,
        order,
      })
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

    it('should return a client when found', async () => {
      mockClientRepository.findOne.mockResolvedValue(mockClient)

      const result = await service.findOne({ id: 'client-id' })

      expect(result).toEqual(mockClient)
      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-id' },
        relations: undefined,
        order: undefined,
      })
    })

    it('should throw NotFoundException when client not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne({ id: 'non-existent-id' })).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should find client with relations', async () => {
      const relations: FindOptionsRelations<Client> = {
        company: true,
      }

      mockClientRepository.findOne.mockResolvedValue({
        ...mockClient,
        company: { id: 'company-id', name: 'Test Company' },
      })

      const result = await service.findOne({ id: 'client-id' }, relations)

      expect(result.company).toBeDefined()
      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-id' },
        relations,
        order: undefined,
      })
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
      userName: 'clientuser',
      firstName: 'Original',
      lastName: 'Client',
      role: UserRoles.CLIENT,
      isVerified: true,
    }

    const mockUpdatedClient = {
      ...mockClient,
      ...updateClientDto,
    }

    it('should update a client successfully', async () => {
      mockClientRepository.findOne
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockUpdatedClient)
      mockClientRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.update('client-id', updateClientDto)

      expect(result).toEqual(mockUpdatedClient)
      expect(mockClientRepository.findOne).toHaveBeenCalledTimes(2)
      expect(mockClientRepository.update).toHaveBeenCalledWith(
        'client-id',
        updateClientDto,
      )
    })

    it('should throw NotFoundException when client not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(null)

      await expect(
        service.update('non-existent-id', updateClientDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('isVerified', () => {
    it('should return true for verified client', async () => {
      const mockClient = {
        id: 'client-id',
        isVerified: true,
      }

      mockClientRepository.findOne.mockResolvedValue(mockClient)

      const result = await service.isVerified('client-id')

      expect(result).toBe(true)
      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-id' },
      })
    })

    it('should return false for unverified client', async () => {
      const mockClient = {
        id: 'client-id',
        isVerified: false,
      }

      mockClientRepository.findOne.mockResolvedValue(mockClient)

      const result = await service.isVerified('client-id')

      expect(result).toBe(false)
    })

    it('should throw NotFoundException when client not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(null)

      await expect(service.isVerified('non-existent-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
