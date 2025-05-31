import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { ClientService } from 'src/client/client.service'

@Injectable()
export class UserVerifiedGuard implements CanActivate {
  private clientService: ClientService

  constructor(private moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.clientService) {
      this.clientService = this.moduleRef.get(ClientService, {
        strict: false,
      })
    }

    const request = context.switchToHttp().getRequest()
    if (!request || !request.user || !request.user.sub) {
      return false
    }

    try {
      return await this.clientService.isVerified(request.user.sub)
    } catch (error) {
      return false
    }
  }
}
