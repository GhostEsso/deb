import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ServicesController],
    providers: [GeminiService, ServicesService, CloudinaryService],
    exports: [GeminiService, ServicesService, CloudinaryService],
})
export class ServicesModule { }
