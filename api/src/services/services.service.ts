import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { Service } from '../generated/client';

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    async create(createServiceDto: CreateServiceDto): Promise<Service> {
        return this.prisma.service.create({
            data: createServiceDto,
        });
    }

    async findAll(): Promise<Service[]> {
        return this.prisma.service.findMany({
            where: { isActive: true },
        });
    }

    async findOne(id: string): Promise<Service> {
        const service = await this.prisma.service.findUnique({
            where: { id },
        });
        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }
        return service;
    }

    async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
        return this.prisma.service.update({
            where: { id },
            data: updateServiceDto,
        });
    }

    async remove(id: string): Promise<Service> {
        return this.prisma.service.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async updateImageUrl(id: string, imageUrl: string): Promise<Service> {
        return this.prisma.service.update({
            where: { id },
            data: { imageUrl },
        });
    }
}
