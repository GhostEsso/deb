import { IsEmail, IsString, MinLength, IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @MinLength(2)
    firstName: string;

    @IsString()
    @MinLength(2)
    lastName: string;

    @IsDateString()
    birthDate: string;

    @IsEnum(Gender)
    gender: Gender;

    @IsOptional()
    @IsString()
    phoneNumber?: string;
}
