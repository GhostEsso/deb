import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AuthModule } from '../auth/auth.module';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [PrismaModule, AuthModule, CommonModule],
    controllers: [ServicesController],
    providers: [GeminiService, ServicesService],
    exports: [GeminiService, ServicesService, CommonModule],
})
export class ServicesModule { }
