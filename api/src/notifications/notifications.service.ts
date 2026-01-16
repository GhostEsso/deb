import { Injectable } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    private expo = new Expo();

    constructor(private prisma: PrismaService) { }

    async sendNotification(userId: string, title: string, body: string, data?: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true }
        });

        if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
            console.log(`Push token invalide ou absent pour l'utilisateur ${userId}`);
            return;
        }

        const messages: ExpoPushMessage[] = [{
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data,
        }];

        try {
            const chunks = this.expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                await this.expo.sendPushNotificationsAsync(chunk);
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
        }
    }

    async notifyAdmin(title: string, body: string, data?: any) {
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, pushToken: true }
        });

        for (const admin of admins) {
            if (admin.pushToken && Expo.isExpoPushToken(admin.pushToken)) {
                await this.sendNotification(admin.id, title, body, data);
            }
        }
    }
}
