import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
