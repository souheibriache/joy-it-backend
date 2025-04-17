import { Test, TestingModule } from '@nestjs/testing'
import { NwesletterService } from './nwesletter.service'

describe('NwesletterService', () => {
  let service: NwesletterService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NwesletterService],
    }).compile()

    service = module.get<NwesletterService>(NwesletterService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
