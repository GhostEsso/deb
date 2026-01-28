import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

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
