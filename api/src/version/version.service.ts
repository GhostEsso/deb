import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersionService {
    // Pour éviter d'alourdir la DB avec une seule ligne, on peut utiliser une constante
    // Ou on pourrait créer un fichier json, mais pour ce projet, une constante gérée
    // via l'API est souvent plus simple pour commencer.

    private currentVersion = {
        version: '1.0.1',
        apkUrl: 'https://github.com/votre-repo/mobile/releases/download/v1.0.1/app-release.apk',
        forceUpdate: false,
        notes: 'Amélioration de la stabilité et nouvelles icônes NailsDG.'
    };

    getVersion() {
        return this.currentVersion;
    }

    // Optionnel : permettre à l'admin de changer via l'API plus tard
    updateVersion(data: any) {
        this.currentVersion = { ...this.currentVersion, ...data };
        return this.currentVersion;
    }
}
