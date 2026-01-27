import { Controller, Patch, Body, Param, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Post(':id/profile-picture')
    @UseInterceptors(FileInterceptor('file'))
    uploadProfilePicture(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.usersService.updateProfilePicture(id, file);
    }
}
