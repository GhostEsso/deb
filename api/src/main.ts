import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';

let cachedApp: any;

async function bootstrap(): Promise<Express> {
  const server: Express = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors();
  app.setGlobalPrefix('api/V1');
  await app.init();
  return server;
}

const handler = async (req: Request, res: Response) => {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  return cachedApp(req, res);
};

// Pour le développement local
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = process.env.PORT ?? 3000;
  bootstrap().then((server: any) => {
    server.listen(port, () => {
      console.log(`Application is running on: http://localhost:${port}/api/V1`);
    });
  });
}

export default handler;
