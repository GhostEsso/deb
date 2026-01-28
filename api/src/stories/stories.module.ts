import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service.js';
import { StoriesController } from './stories.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';

import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        PrismaModule,
        CommonModule,
        MulterModule.register({
            storage: memoryStorage(),
        }),
    ],
    controllers: [StoriesController],
    providers: [StoriesService],
})
export class StoriesModule { }
