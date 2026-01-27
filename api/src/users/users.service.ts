import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../common/cloudinary.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) { }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        const data: any = {
            firstName: dto.firstName,
            lastName: dto.lastName,
        };

        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });

        const { password, ...userWithoutPassword } = updatedUser;
        return {
            success: true,
            user: userWithoutPassword,
        };
    }

    async updateProfilePicture(id: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Fichier manquant');
        }

        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // 1. Upload new image
        const result = await this.cloudinaryService.uploadImage(file, 'profiles');

        // 2. Delete old image if exists
        if (user.profilePicturePublicId) {
            try {
                await this.cloudinaryService.deleteImage(user.profilePicturePublicId);
            } catch (error) {
                console.error('Error deleting old profile picture:', error);
            }
        }

        // 3. Update database
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                profilePictureUrl: result.secure_url,
                profilePicturePublicId: result.public_id,
            },
        });

        const { password, ...userWithoutPassword } = updatedUser;
        return {
            success: true,
            user: userWithoutPassword,
        };
    }
}
