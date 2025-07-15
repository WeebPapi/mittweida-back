import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const keyPath = join(__dirname, '..', 'ssl', 'key.pem');
  const certPath = join(__dirname, '..', 'ssl', 'cert.pem');
  let httpsOptions = {};

  try {
    const privateKey = readFileSync(keyPath, 'utf8');
    const certificate = readFileSync(certPath, 'utf8');
    httpsOptions = { key: privateKey, cert: certificate };
    console.log('SSL certificates loaded successfully.');
  } catch (error) {
    console.error('Error loading SSL certificates:', error.message);
    console.warn(
      'Application will run without HTTPS due to certificate loading issues.',
    );
  }
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      'https://mittweida-front.vercel.app',
      'https://localhost:5173',
      'https://192.168.0.101:5173',
      'https://80.241.200.66:5173',
      'http://localhost:5173',
      'http://192.168.0.101:5173',
      'http://80.241.200.66:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('Mittweida Api')
    .setVersion('1.0')
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      },
      'acessTokenCookie',
    )
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
      },
      'refreshTokenCookie',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
