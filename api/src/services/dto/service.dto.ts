import { IsString, IsNumber, IsOptional, IsPositive, MinLength } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsNumber()
    @IsPositive()
    duration: number; // in minutes
}

export class UpdateServiceDto {
    @IsString()
    @IsOptional()
    @MinLength(3)
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    price?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    duration?: number;
}
