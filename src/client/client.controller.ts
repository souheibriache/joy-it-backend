import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common'
import { ClientService } from './client.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('clients')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createClientDto: CreateClientDto) {
    return await this.clientService.create(createClientDto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'Return all clients.' })
  async findAll() {
    return await this.clientService.find()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiResponse({ status: 200, description: 'Return the client.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  async findOne(@Param('id') id: string) {
    return await this.clientService.findOne({ id })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return await this.clientService.update(id, updateClientDto)
  }

  @Get(':id/verified')
  @ApiOperation({ summary: 'Check if a client is verified' })
  @ApiResponse({ status: 200, description: 'Return verification status.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  async isVerified(@Param('id') id: string) {
    return await this.clientService.isVerified(id)
  }
}
