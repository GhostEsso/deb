import { Controller, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private prisma: PrismaService) { }

    @Post('token/:userId')
    async updateToken(
        @Param('userId') userId: string,
        @Body() body: { token: string }
    ) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { pushToken: body.token },
        });
    }
}
