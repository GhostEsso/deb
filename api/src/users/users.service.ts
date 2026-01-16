import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
}
