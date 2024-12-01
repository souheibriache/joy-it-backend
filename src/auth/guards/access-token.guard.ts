import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { extractTokenFromHeader } from '@app/common/utils/methods';
import { AuthService } from '../auth.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private authService: AuthService;

  constructor(private moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authService) {
      this.authService = this.moduleRef.get(AuthService, { strict: false });
    }
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();

    const payload = await this.authService.verifyToken(token);
    if (!payload) throw new UnauthorizedException();

    //? We're assigning the payload to the request object here
    //? so that we can access it in our route handlers
    request.user = payload;

    return true;
  }
}
