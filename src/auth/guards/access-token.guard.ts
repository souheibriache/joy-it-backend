import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { JwtAuthService } from '../services/jwt-auth.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private jwtAuthService: JwtAuthService

  constructor(private moduleRef: ModuleRef) {}

  private async getJwtAuthService(): Promise<JwtAuthService> {
    if (!this.jwtAuthService) {
      this.jwtAuthService = this.moduleRef.get(JwtAuthService, {
        strict: false,
      })
    }
    return this.jwtAuthService
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    if (!request) {
      throw new UnauthorizedException('Invalid request')
    }

    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.length) {
      throw new UnauthorizedException('No authorization header')
    }

    const [type, token] = authHeader.split(' ')
    if (type !== 'Bearer' || !token || typeof token !== 'string') {
      throw new UnauthorizedException('Invalid token format')
    }

    try {
      const jwtService = await this.getJwtAuthService()
      const payload = await jwtService.verifyToken(token)

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload')
      }

      request.user = {
        id: payload.sub,
        ...(payload.email && { email: payload.email }),
        ...(payload.role && { role: payload.role }),
        ...(payload.metadata && { metadata: payload.metadata }),
        ...(payload.permissions && { permissions: payload.permissions }),
      }

      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
