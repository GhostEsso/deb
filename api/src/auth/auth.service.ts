import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserRole } from '../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async register(dto: RegisterDto) {
        // Vérifier si l'email existe déjà
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            // Si l'utilisateur existe mais n'est PAS vérifié, on autorise la "réinscription" (mise à jour)
            if (!existingUser.isVerified) {
                // Hasher le mot de passe
                const hashedPassword = await bcrypt.hash(dto.password, 10);

                // Générer un code à 4 chiffres
                const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
                const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

                const updatedUser = await this.prisma.user.update({
                    where: { email: dto.email },
                    data: {
                        password: hashedPassword,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        birthDate: new Date(dto.birthDate),
                        gender: dto.gender,
                        phoneNumber: dto.phoneNumber,
                        role: dto.email === 'tedeborah1997@gmail.com' ? UserRole.ADMIN : UserRole.CLIENT,
                        verificationCode,
                        verificationCodeExpiresAt,
                    },
                });

                // Renvoyer l'email de bienvenue avec le code (en arrière-plan)
                this.mailService.sendUserConfirmation(updatedUser, verificationCode)
                    .catch(err => console.error('Erreur lors de l\'envoi du mail de confirmation:', err));

                const { password, verificationCode: vc, ...userWithoutPassword } = updatedUser;
                return {
                    success: true,
                    user: userWithoutPassword,
                    requiresVerification: true,
                };
            }

            throw new ConflictException('Cet email est déjà utilisé et vérifié. Veuillez vous connecter.');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Générer un code à 4 chiffres
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Créer l'utilisateur
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: dto.firstName,
                lastName: dto.lastName,
                birthDate: new Date(dto.birthDate),
                gender: dto.gender,
                phoneNumber: dto.phoneNumber,
                role: dto.email === 'tedeborah1997@gmail.com' ? UserRole.ADMIN : UserRole.CLIENT,
                isVerified: false,
                verificationCode,
                verificationCodeExpiresAt,
            },
        });

        // Envoyer l'email de bienvenue avec le code (en arrière-plan)
        this.mailService.sendUserConfirmation(user, verificationCode)
            .catch(err => console.error('Erreur lors de l\'envoi du mail de confirmation:', err));

        // Retourner l'utilisateur sans le mot de passe
        const { password, verificationCode: vc, ...userWithoutPassword } = user;
        return {
            success: true,
            user: userWithoutPassword,
            requiresVerification: true,
        };
    }

    async verifyCode(email: string, code: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Utilisateur non trouvé');
        }

        if (user.isVerified) {
            return { success: true, message: 'Compte déjà vérifié' };
        }

        if (user.verificationCode !== code) {
            throw new UnauthorizedException('Code incorrect');
        }

        if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
            throw new UnauthorizedException('Code expiré');
        }

        // Valider le compte et nettoyer le code
        await this.prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationCodeExpiresAt: null,
            },
        });

        return { success: true, message: 'Compte vérifié avec succès' };
    }

    async login(dto: LoginDto) {
        // Trouver l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        if (!user.isVerified) {
            throw new UnauthorizedException('Compte non vérifié. Veuillez valider le code reçu par email.');
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        // Retourner l'utilisateur sans le mot de passe
        const { password, ...userWithoutPassword } = user;
        return {
            success: true,
            user: userWithoutPassword,
        };
    }
}
