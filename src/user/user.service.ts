import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateUser(userName: string, password?: string) {
    const user = await this.prismaService.user.findUnique({
      where: { userName, deleted: false, disabled: false },
      select: { id: true, password: true },
    });
    if (!user) {
      return false;
    }

    if (password === undefined) {
      return true;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return false;
    }

    return true;
  }
}
