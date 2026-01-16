import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { PrismaModule } from '../prisma/prisma.module';

import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [AuthController],
    providers: [AuthService, FirebaseService],
    exports: [AuthService, FirebaseService],
})
export class AuthModule { }
