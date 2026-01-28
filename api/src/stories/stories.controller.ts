import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../common/cloudinary.service';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/story.dto';

@Controller('stories')
export class StoriesController {
    constructor(
        private readonly storiesService: StoriesService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        console.log('[StoriesController] uploadImage called at:', new Date().toISOString());
        console.log('[StoriesController] File data:', file ? {
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        } : 'UNDEFINED');

        if (!file) {
            throw new Error('No file uploaded');
        }
        const result = await this.cloudinaryService.uploadImage(file, 'stories');
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    }

    @Post()
    create(@Body() createStoryDto: CreateStoryDto) {
        return this.storiesService.create(createStoryDto);
    }

    @Get()
    findAllActive() {
        return this.storiesService.findAllActive();
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.storiesService.remove(id);
    }
}
