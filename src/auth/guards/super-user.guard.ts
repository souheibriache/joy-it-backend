import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { AuthService } from '../services/auth.service'

@Injectable()
export class SuperUserGuard implements CanActivate {
  private authService: AuthService

  constructor(private moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authService) {
      this.authService = this.moduleRef.get(AuthService, {
        strict: false,
      })
    }

    const request = context.switchToHttp().getRequest()
    if (!request || !request.user || !request.user.id) {
      return false
    }

    try {
      return await this.authService.isSuperUser(request.user.id)
    } catch (error) {
      return false
    }
  }
}
