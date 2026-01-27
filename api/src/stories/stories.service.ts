import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CreateStoryDto } from './dto/story.dto';

@Injectable()
export class StoriesService {
    private readonly logger = new Logger(StoriesService.name);

    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService,
    ) { }

    async create(createStoryDto: CreateStoryDto) {
        // Expire après 24 heures
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        return this.prisma.story.create({
            data: {
                ...createStoryDto,
                expiresAt,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async findAllActive() {
        const now = new Date();
        return this.prisma.story.findMany({
            where: {
                expiresAt: {
                    gt: now,
                },
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async remove(id: string) {
        const story = await this.prisma.story.findUnique({
            where: { id },
        });

        if (story) {
            try {
                await this.cloudinaryService.deleteImage(story.publicId);
            } catch (error) {
                this.logger.error(`Failed to delete image from Cloudinary for story ${id}: ${error.message}`);
            }
            return this.prisma.story.delete({
                where: { id },
            });
        }
    }

    // Cron job pour nettoyer les stories expirées toutes les heures
    @Cron(CronExpression.EVERY_HOUR)
    async handleExpiredStories() {
        this.logger.log('Checking for expired stories to clean up...');
        const now = new Date();

        const expiredStories = await this.prisma.story.findMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        });

        if (expiredStories.length === 0) {
            this.logger.log('No expired stories found.');
            return;
        }

        this.logger.log(`Found ${expiredStories.length} expired stories. Deleting images from Cloudinary...`);

        for (const story of expiredStories) {
            try {
                await this.cloudinaryService.deleteImage(story.publicId);
            } catch (error) {
                this.logger.error(`Error deleting image for expired story ${story.id}: ${error.message}`);
                // On continue quand même pour supprimer de la DB
            }
        }

        const deleteResult = await this.prisma.story.deleteMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        });

        this.logger.log(`Successfully deleted ${deleteResult.count} expired stories from database.`);
    }
}
