import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../generated/client';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendUserConfirmation(user: User, token: string) {
        // Note: In a real app we would send a confirmation link
        // For now we just send a welcome email

        await this.mailerService.sendMail({
            to: user.email,
            // from: '"Support Team" <support@example.com>', // override default from
            subject: 'Bienvenue ! Confirmez votre compte',
            template: './welcome', // `.hbs` extension is appended automatically
            context: {
                name: user.firstName,
                code: token,
            },
        });
    }
}
