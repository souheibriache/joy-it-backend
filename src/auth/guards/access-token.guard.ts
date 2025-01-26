import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { extractTokenFromHeader } from '@app/common/utils/methods'
import { ModuleRef } from '@nestjs/core'
import { JwtAuthService } from '../services/jwt-auth.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private jwtAuthService: JwtAuthService

  constructor(private moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.jwtAuthService) {
      this.jwtAuthService = this.moduleRef.get(JwtAuthService, {
        strict: false,
      })
    }
    const request = context.switchToHttp().getRequest()
    const token = extractTokenFromHeader(request)
    if (!token) throw new UnauthorizedException()

    const payload = await this.jwtAuthService.verifyToken(token)
    if (!payload) throw new UnauthorizedException()

    //? We're assigning the payload to the request object here
    //? so that we can access it in our route handlers
    const { sub, ...rest } = payload

    request.user = { id: sub, ...rest }

    return true
  }
}
