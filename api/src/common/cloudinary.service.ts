import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(
        file: Express.Multer.File,
        folder: string,
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Upload failed'));
                    resolve(result);
                },
            );

            if (!file || !file.buffer) {
                return reject(new Error('File buffer is missing'));
            }
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    async deleteImage(publicId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
    }
}
