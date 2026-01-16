import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async generateOptimizationSuggestions(data: any): Promise<string> {
        const prompt = `
      Tu es un expert en optimisation de planning pour prothésiste ongulaire.
      En te basant sur les données suivantes des 30 derniers jours :
      ${JSON.stringify(data.history)}
      
      Et les préférences de l'admin :
      ${JSON.stringify(data.preferences)}
      
      Suggère des intervalles de réservation optimaux et des conseils pour maximiser le nombre de clients tout en respectant les pauses.
      Réponds en français de manière concise et professionnelle.
    `;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}
