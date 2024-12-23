import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthService } from '../auth.service'
import { ModuleRef } from '@nestjs/core'

@Injectable()
export class SuperUserGuard implements CanActivate {
  private authService: AuthService

  constructor(private moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authService) {
      this.authService = this.moduleRef.get(AuthService, { strict: false })
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    return await this.authService.isSuperUser(user.sub)
  }
}
