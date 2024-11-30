import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';

export class SuperUserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return await this.authService.isSuperUser(user.id);
  }
}
