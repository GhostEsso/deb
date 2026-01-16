import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const now = new Date();

        // Aujourd'hui
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        // Cette Semaine (départ Lundi)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour Lundi
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Ce Mois
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [today, week, month] = await Promise.all([
            this.calculateRange(startOfToday, endOfToday),
            this.calculateRange(startOfWeek, endOfToday),
            this.calculateRange(startOfMonth, endOfToday),
        ]);

        return {
            today,
            week,
            month,
        };
    }

    private async calculateRange(start: Date, end: Date) {
        const bookings = await this.prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                date: {
                    gte: start,
                    lte: end,
                }
            },
            include: {
                service: {
                    select: {
                        price: true
                    }
                }
            }
        });

        const total = bookings.reduce((sum, booking) => sum + (booking.service?.price || 0), 0);

        return {
            amount: total,
            count: bookings.length
        };
    }
}
