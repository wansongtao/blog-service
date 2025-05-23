import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import bcrypt, { hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { getBaseConfig } from 'src/common/config';
import { UserPermissionInfoEntity } from './entities/user-permission-info.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  private generateHashPassword(password: string) {
    return hash(password, getBaseConfig(this.configService).bcryptSaltRounds);
  }

  private getDefaultPassword() {
    return getBaseConfig(this.configService).defaultPassword;
  }

  private async removeUserToken(id: string) {
    const ssoHandler = this.redisService.sso(id);
    const token = await ssoHandler.get();
    if (token) {
      this.redisService.blackList().set(token);
    }
    ssoHandler.remove();
  }

  async findUser(userName: string): Promise<{
    id: string;
    userName: string;
    password: string;
    disabled: boolean;
  } | null> {
    const user = await this.prismaService.user.findUnique({
      where: { userName, deleted: false },
      select: { id: true, userName: true, password: true, disabled: true },
    });

    return user;
  }

  async findUserPermissionInfo(id: string) {
    return await this.prismaService.$queryRaw<UserPermissionInfoEntity[]>`
      WITH filtered_users AS (
        SELECT u.id, u.user_name, p.avatar, p.nick_name
        FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ${id} and u.deleted = false and u.disabled = false
      ),
      user_roles AS (
        SELECT ur.user_id, 
        STRING_AGG(r.name, ','ORDER BY r.name) AS role_names, 
        ARRAY_AGG(r.id) AS role_ids
        FROM filtered_users fu
        LEFT JOIN role_in_user ur ON fu.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE r.disabled = false
        GROUP BY ur.user_id
      ),
      role_permissions AS (
        SELECT DISTINCT
            ur.user_id, p.pid, p.id, p.name, p.path, p.permission, p.type, p.icon, 
            p.component, p.redirect, p.hidden, p.sort, p.cache, p.props
        FROM user_roles ur
          JOIN role_in_permission rp ON rp.role_id = ANY (ur.role_ids)
          JOIN permissions p ON rp.permission_id = p.id AND p.disabled = false
      )
      SELECT fu.user_name, fu.nick_name, fu.avatar, ur.role_names, rp.pid,
      rp.id, rp.name, rp.path, rp.permission, rp.type, rp.icon, rp.component, rp.redirect, rp.hidden, 
      rp.sort, rp.cache, rp.props
      FROM filtered_users fu
        LEFT JOIN user_roles ur ON fu.id = ur.user_id
        LEFT JOIN role_permissions rp ON fu.id = rp.user_id
      ORDER BY rp.sort DESC;
    `;
  }

  async findProfile(id: string) {
    const profiles: (UserProfileEntity & {
      user_name: string;
      nick_name: string;
      role_names: string;
    })[] = await this.prismaService.$queryRaw`
      WITH user_base AS (SELECT id, user_name FROM users WHERE id = ${id})
      SELECT ub.user_name, p.avatar, p.nick_name, p.birthday, p.description, p.email, p.gender, 
      p.phone, COALESCE(string_agg(r.name, ','), '') AS role_names
      FROM user_base ub
      INNER JOIN profiles p ON ub.id = p.user_id
      LEFT JOIN role_in_user ur ON ub.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY ub.id, ub.user_name, p.id, p.avatar, p.nick_name, p.birthday, p.description, 
      p.email, p.gender, p.phone;
    `;

    if (!profiles || profiles.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const profile = profiles[0];
    const userName = profile.user_name;
    delete profile.user_name;

    const nickName = profile.nick_name;
    delete profile.nick_name;

    const roles = profile.role_names ? profile.role_names.split(',') : [];
    delete profile.role_names;

    const userProfile: UserProfileEntity = {
      ...profile,
      userName,
      roles,
      nickName,
    };
    return userProfile;
  }

  async updateProfile(id: string, profile: UpdateProfileDto) {
    if (profile.birthday) {
      profile.birthday = profile.birthday + 'T00:00:00Z';
    }

    await this.prismaService.profile.update({
      where: { userId: id },
      data: profile,
    });
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    if (updatePasswordDto.oldPassword === updatePasswordDto.newPassword) {
      throw new BadRequestException('新密码和原密码不能相同');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      getBaseConfig(this.configService).bcryptSaltRounds,
    );
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashPassword },
    });
  }

  async findAll(queryUserDto: QueryUserDto) {
    const {
      disabled,
      keyword,
      page = 1,
      pageSize = 10,
      beginTime,
      endTime,
      sort = 'desc',
    } = queryUserDto;

    const where: Prisma.UserWhereInput = {
      deleted: false,
      disabled,
      createdAt: {
        gte: beginTime,
        lte: endTime,
      },
      OR: [
        { userName: { contains: keyword, mode: 'insensitive' } },
        { profile: { nickName: { contains: keyword, mode: 'insensitive' } } },
      ],
    };

    const users = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: sort },
        select: {
          id: true,
          userName: true,
          disabled: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              nickName: true,
              avatar: true,
            },
          },
          roleInUser: {
            select: {
              roles: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    const userList = users[0].map((user) => {
      return {
        id: user.id,
        userName: user.userName,
        disabled: user.disabled,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        nickName: user.profile?.nickName,
        avatar: user.profile?.avatar,
        roleNames: user.roleInUser.map((roleInUser) => roleInUser.roles.name),
      };
    });

    return { list: userList, total: users[1] };
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { userName: createUserDto.userName },
      select: { id: true },
    });
    if (user) {
      throw new BadRequestException('用户已存在');
    }

    const password = this.getDefaultPassword();
    const hashedPassword = await this.generateHashPassword(password);

    await this.prismaService.user.create({
      data: {
        userName: createUserDto.userName,
        password: hashedPassword,
        disabled: createUserDto.disabled,
        profile: {
          create: {
            nickName: createUserDto.nickName,
          },
        },
        roleInUser: createUserDto.roles && {
          createMany: {
            data: createUserDto.roles.map((roleId) => ({
              roleId,
            })),
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: {
        userName: true,
        disabled: true,
        profile: {
          select: { nickName: true },
        },
        roleInUser: {
          select: {
            roleId: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const profile = user.profile;
    const roles = user.roleInUser.map((role) => role.roleId);
    return {
      userName: user.userName,
      disabled: user.disabled,
      ...profile,
      roles,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (
      user.userName === getBaseConfig(this.configService).defaultAdmin.username
    ) {
      if (updateUserDto.disabled) {
        throw new BadRequestException('不能禁用超级管理员');
      }

      if (updateUserDto.roles) {
        throw new BadRequestException('不能修改超级管理员角色');
      }
    }

    const data: Prisma.UserUpdateInput = {
      disabled: updateUserDto.disabled,
      profile: {
        update: {
          nickName: updateUserDto.nickName,
        },
      },
    };
    if (updateUserDto.disabled) {
      this.redisService.userPermissions(id).remove();
      this.removeUserToken(id);
    }

    if (updateUserDto.roles || updateUserDto.roles === null) {
      this.redisService.userPermissions(id).remove();
      data.roleInUser = {
        deleteMany: {},
      };

      if (updateUserDto.roles.length) {
        data.roleInUser.createMany = {
          data: updateUserDto.roles.map((roleId) => ({
            roleId,
          })),
        };
      }
    }

    await this.prismaService.user.update({
      where: { id, deleted: false },
      data,
    });
  }

  async remove(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (
      user.userName === getBaseConfig(this.configService).defaultAdmin.username
    ) {
      throw new BadRequestException('不能删除超级管理员');
    }

    this.redisService.userPermissions(id).remove();
    this.removeUserToken(id);

    await this.prismaService.user.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async resetPassword(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id, deleted: false },
      select: { userName: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (
      user.userName === getBaseConfig(this.configService).defaultAdmin.username
    ) {
      throw new BadRequestException('不能重置超级管理员密码');
    }

    const defaultPassword = this.getDefaultPassword();
    const password = await this.generateHashPassword(defaultPassword);

    await this.prismaService.user.update({
      where: { id },
      data: { password },
    });

    return { message: `重置密码成功，默认密码为：${defaultPassword}` };
  }
}
