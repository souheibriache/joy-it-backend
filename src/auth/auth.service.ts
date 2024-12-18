import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { SignupDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities';
import { UserService } from 'src/user/user.service';
import { LoginDto, LoginUserPayload, RefreshTokenDto } from './dto';
import { MetadataDto } from './dto/metadata.dto';
import { UserDto } from './dto/user.dto';
import { IRefreshToken } from './interfaces';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '@app/common/utils/constants/jwt-ttl';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Payload } from './dto/payload.dto';
import { ClientService } from 'src/client/client.service';
import { Client } from 'src/client/entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly clientService: ClientService,
  ) {}

  async signup(createUserDto: SignupDto) {
    const user = await this.userService.findAll({
      email: createUserDto.email,
      userName: createUserDto.userName,
    });
    if (user.length) throw new BadRequestException('This user already exists!');

    const { password, ...rest } = createUserDto;

    const hashedPassword = await this.hash(password);

    await this.clientService.create({ ...rest, password: hashedPassword });

    return true;
  }

  async isValidUserName(username: string) {
    const users = await this.userService.findAll({
      userName: username.trim().toLowerCase(),
    });
    if (users.length > 0) throw new BadRequestException('Invalid username');
    return true;
  }

  async generageUsername(firstName: string, lastName: string, count) {
    let username = firstName + '.' + lastName;
    if (count) {
      count++;
    } else {
      count = 1;
    }

    const users = await this.userService.findAll({ userName: username });
    if (users) return this.generageUsername(firstName, lastName, count);
    else return username;
  }

  async loginAdmin(loginDto: LoginDto) {
    const { login, password } = loginDto;

    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login, isSuperUser: true },
      { userName: login, isSuperUser: true },
    ];

    const user = await this.userService.findOne({
      select: { password: true, id: true, email: true, userName: true },
      where: where,
    });

    if (!user) throw new ForbiddenException('Wrong credintials');

    const isValidPassword = await this.compare(password, user.password);

    if (!isValidPassword) throw new ForbiddenException('Wrong credintials');

    return await this.authenticate(user, {});
  }

  async login(loginDto: LoginDto) {
    const { login, password } = loginDto;

    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login },
      { userName: login },
    ];

    const user = await this.userService.findOne({
      select: { password: true, id: true, email: true, userName: true },
      where: where,
    });

    if (!user) throw new ForbiddenException('Wrong credintials');

    const isValidPassword = await this.compare(password, user.password);

    if (!isValidPassword) throw new ForbiddenException('Wrong credintials');

    const payloadMetaData = await this.getClientMetaData(user.id);

    return await this.authenticate(user, payloadMetaData);
  }

  async hash(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async compare(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async authenticate(
    user: User,
    metadata: MetadataDto,
  ): Promise<LoginUserPayload> {
    const access_token = await this.generateAccessToken({ ...user, metadata });

    const refresh_token = await this.generateRefreshToken({
      ...user,
      metadata,
    });

    return { access_token, refresh_token };
  }

  async generateAccessToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata };
    const expiresIn = ACCESS_TOKEN_TTL;

    return await this.jwtService.signAsync(payload, { expiresIn });
  }

  async generateRefreshToken(user: UserDto): Promise<string> {
    const payload = { sub: user.id, metadata: user.metadata };
    const expiresIn = REFRESH_TOKEN_TTL;

    const refreshToken = await this.createRefreshToken(user, expiresIn);
    const token = await this.jwtService.signAsync(
      { ...payload, jwtId: refreshToken.id },
      { expiresIn },
    );

    return token;
  }

  async createRefreshToken(
    user: Pick<User, 'id'>,
    ttl: number,
  ): Promise<IRefreshToken> {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + ttl);

    const refreshToken = this.refreshTokenRepository.create({
      user: user,
      expires: expirationDate,
    });
    return await this.refreshTokenRepository.save(refreshToken);
  }

  async verifyToken(token: string): Promise<Payload | undefined> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      return;
    }
  }

  async refreshToken(input: RefreshTokenDto) {
    const { refreshToken } = input;
    const { user } = await this.resolveRefreshToken(refreshToken);

    const metadata = await this.getClientMetaData(user.id);

    const accessToken = await this.generateAccessToken({
      ...user,
      metadata,
    });

    return {
      access_token: accessToken,
    };
  }

  async resolveRefreshToken(encoded: string) {
    try {
      const payload = await this.jwtService.verify(encoded);
      if (!payload.sub || !payload.jwtId) {
        throw new UnprocessableEntityException('Invalid refresh token !');
      }

      const refreshToken = await this.refreshTokenRepository.findOne({
        where: {
          id: payload.jwtId,
        },
      });

      if (!refreshToken) {
        throw new UnprocessableEntityException('Refresh token not found.');
      }

      if (refreshToken.isRevoked) {
        throw new UnprocessableEntityException('Refresh token revoked.');
      }

      const user = await this.userService.getOneById(payload.sub);

      if (!user) {
        throw new UnprocessableEntityException('Invalid refresh token !');
      }

      return { user, payload };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Refresh token expired');
      } else {
        throw new UnprocessableEntityException('Invalid refresh token !');
      }
    }
  }

  async isSuperUser(userId: string) {
    const user = await this.userService.findOne({ where: { id: userId } });
    return user?.isSuperUser;
  }

  async getClientMetaData(clientId: string) {
    const client = await this.clientService.findOne(
      { id: clientId },
      { company: { subscription: true } },
    );

    return {
      companyId: client?.company?.id,
      isVerified: client.isVerified,
      isCompanyVerified: client?.company?.isVerified,
      hasSubscription: client?.company?.subscription?.id,
    };
  }

  async getProfile(userId: string) {
    return await this.userService.findOne({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, userName: true },
    });
  }
}
