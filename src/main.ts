import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation with detailed error messages
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        return {
          field: error.property,
          constraints: error.constraints
        };
      });
      return new BadRequestException({
        message: 'Validation failed',
        errors: messages
      });
    },
  }));
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4200'], // Adjust for your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();