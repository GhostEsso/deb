import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FirebaseService {
    private storage: admin.storage.Storage;

    constructor(private configService: ConfigService) {
        if (!admin.apps.length) {
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

            if (projectId && clientEmail && privateKey && !privateKey.includes('your-private-key')) {
                try {
                    // Handle both literal \n and real newlines, and remove quotes if they were included
                    const formattedKey = privateKey
                        .replace(/\\n/g, '\n')
                        .replace(/^"|"$/g, '')
                        .trim();

                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId,
                            clientEmail,
                            privateKey: formattedKey,
                        }),
                        storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
                    });
                    console.log('Firebase Admin initialized successfully');
                } catch (error) {
                    console.error('Failed to initialize Firebase Admin:', error.message);
                }
            } else {
                console.warn('Firebase Admin credentials not fully configured. Some features may not work.');
            }
        }
        if (admin.apps.length) {
            this.storage = admin.storage();
        }
    }

    async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
        try {
            return await admin.auth().verifyIdToken(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid Firebase Token');
        }
    }

    async uploadImage(file: Express.Multer.File, folder: string): Promise<string> {
        if (!this.storage) {
            throw new Error('Firebase Storage is not initialized. Check your credentials.');
        }
        const bucket = this.storage.bucket();
        const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
            public: true,
        });

        return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }
}
