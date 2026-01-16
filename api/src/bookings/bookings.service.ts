import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async create(userId: string, dto: CreateBookingDto) {
        const service = await this.prisma.service.findUnique({
            where: { id: dto.serviceId },
        });

        if (!service) {
            throw new NotFoundException('Service non trouvé');
        }

        const bookingDate = new Date(dto.date);
        bookingDate.setSeconds(0, 0); // Normalisation

        if (bookingDate < new Date()) {
            throw new BadRequestException('La date de réservation ne peut pas être dans le passé');
        }

        // Vérifier si le créneau est déjà pris
        const existingBooking = await this.prisma.booking.findFirst({
            where: {
                date: bookingDate,
                status: { not: 'CANCELLED' }
            }
        });

        if (existingBooking) {
            throw new BadRequestException('Ce créneau horaire est déjà réservé par un autre utilisateur.');
        }

        const booking = await this.prisma.booking.create({
            data: {
                date: bookingDate,
                notes: dto.notes,
                userId: userId,
                serviceId: dto.serviceId,
                status: 'PENDING',
            },
            include: {
                service: true,
                user: true,
            }
        });

        // Notifier l'admin
        this.notificationsService.notifyAdmin(
            'Nouveau Rendez-vous !',
            `${booking.user.firstName} a réservé pour : ${booking.service.name}`,
            { bookingId: booking.id }
        ).catch(err => console.error('Erreur notification admin:', err));

        return booking;
    }

    async getBookedSlots(dateStr: string) {
        const date = new Date(dateStr);
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const bookings = await this.prisma.booking.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: { not: 'CANCELLED' }
            },
            select: { date: true }
        });

        return bookings.map(b => {
            const date = new Date(b.date);
            return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
        });
    }

    async findByUser(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [total, items] = await Promise.all([
            this.prisma.booking.count({ where: { userId } }),
            this.prisma.booking.findMany({
                where: { userId },
                skip,
                take: limit,
                include: {
                    service: true,
                },
                orderBy: {
                    date: 'asc',
                },
            })
        ]);

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findAll(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [total, items] = await Promise.all([
            this.prisma.booking.count(),
            this.prisma.booking.findMany({
                skip,
                take: limit,
                include: {
                    service: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phoneNumber: true,
                        }
                    }
                },
                orderBy: {
                    date: 'asc',
                },
            })
        ]);

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async updateStatus(id: string, status: 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'COMPLETED', cancellationReason?: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            throw new NotFoundException('Réservation non trouvée');
        }

        const updatedBooking = await this.prisma.booking.update({
            where: { id },
            data: {
                status,
                cancellationReason: cancellationReason || null,
            },
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        pushToken: true,
                    }
                }
            }
        });

        // Notifier l'utilisateur
        let notificationTitle = '';
        let notificationBody = '';

        if (status === 'ACCEPTED') {
            notificationTitle = 'Rendez-vous Confirmé !';
            notificationBody = `Votre rendez-vous pour "${updatedBooking.service.name}" a été accepté.`;
        } else if (status === 'REFUSED') {
            notificationTitle = 'Rendez-vous Refusé';
            notificationBody = `Malheureusement, votre rendez-vous pour "${updatedBooking.service.name}" a été refusé.`;
        } else if (status === 'CANCELLED') {
            notificationTitle = 'Rendez-vous Annulé';
            notificationBody = `Votre rendez-vous pour "${updatedBooking.service.name}" a été annulé par l'administrateur.`;
        } else if (status === 'COMPLETED') {
            notificationTitle = 'Service Terminé';
            notificationBody = `Merci de nous avoir fait confiance ! À bientôt chez Nails by Divine Grace.`;
        }

        if (notificationTitle) {
            this.notificationsService.sendNotification(
                updatedBooking.userId,
                notificationTitle,
                notificationBody,
                { bookingId: updatedBooking.id, status }
            ).catch(err => console.error('Erreur notification client:', err));
        }

        return updatedBooking;
    }
}
