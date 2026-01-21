import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VersionService } from './version.service';

@Controller('version')
export class VersionController {
    constructor(private readonly versionService: VersionService) { }

    @Get()
    getLatestVersion() {
        return this.versionService.getVersion();
    }

    // Seul l'admin pourra mettre à jour la version via Postman par exemple
    @Post('update')
    updateVersion(@Body() data: any) {
        return this.versionService.updateVersion(data);
    }
}
