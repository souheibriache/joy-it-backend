import { Type } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { mockRepository } from './jest-setup'

export function createTestingModule(
  service: Type<any>,
  entity: Type<any>,
  additionalProviders: any[] = [],
) {
  return {
    providers: [
      service,
      {
        provide: getRepositoryToken(entity),
        useFactory: mockRepository,
      },
      ...additionalProviders,
    ],
  }
}

export function createTestingModuleForController(
  controller: Type<any>,
  service: Type<any>,
  additionalProviders: any[] = [],
) {
  return {
    controllers: [controller],
    providers: [service, ...additionalProviders],
  }
}

export const mockDate = new Date('2024-01-01T00:00:00.000Z')

export function setupDateMock() {
  jest.useFakeTimers()
  jest.setSystemTime(mockDate)
}

export function cleanupDateMock() {
  jest.useRealTimers()
}

export const mockPagination = {
  page: 1,
  limit: 10,
  route: 'test',
}

export const mockPaginationResult = {
  items: [],
  meta: {
    totalItems: 0,
    itemCount: 0,
    itemsPerPage: 10,
    totalPages: 0,
    currentPage: 1,
  },
  links: {
    first: 'test?limit=10',
    previous: '',
    next: '',
    last: 'test?page=0&limit=10',
  },
}
