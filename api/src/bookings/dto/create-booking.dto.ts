import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
    @IsDateString()
    date: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsUUID()
    serviceId: string;
}
