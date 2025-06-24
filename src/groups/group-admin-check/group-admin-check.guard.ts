import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupAdminCheckGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId;

    if (!user || !groupId)
      throw new ForbiddenException('Missing user or group information');

    const membership = await this.prismaService.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
    });

    if (!membership || !membership.isAdmin) {
      throw new ForbiddenException(
        'You must be a group admin to perform this action',
      );
    }

    return true;
  }
}
