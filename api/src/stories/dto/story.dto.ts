import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStoryDto {
    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @IsString()
    @IsNotEmpty()
    publicId: string;

    @IsString()
    @IsOptional()
    caption?: string;

    @IsString()
    @IsNotEmpty()
    userId: string;
}
