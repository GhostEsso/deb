import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AccountingModule } from './accounting/accounting.module';
import { VersionModule } from './version/version.module';
import { StoriesModule } from './stories/stories.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ServicesModule,
    AuthModule,
    MailModule,
    UsersModule,
    BookingsModule,
    NotificationsModule,
    AccountingModule,
    VersionModule,
    StoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
