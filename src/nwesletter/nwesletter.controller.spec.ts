import { Test, TestingModule } from '@nestjs/testing'
import { NwesletterController } from './nwesletter.controller'
import { NwesletterService } from './nwesletter.service'

describe('NwesletterController', () => {
  let controller: NwesletterController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NwesletterController],
      providers: [NwesletterService],
    }).compile()

    controller = module.get<NwesletterController>(NwesletterController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
