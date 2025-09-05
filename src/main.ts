import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { GeneralExceptionFilter } from './general-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that don't exist in the DTO
      forbidNonWhitelisted: true, // throws error if extra props are present
      transform: true, // transforms payloads to DTO classes
    }),
  );
  app.useGlobalFilters(new GeneralExceptionFilter());

  // Setup swagger
  const config = new DocumentBuilder()
    .setTitle('Hybrid Encryption')
    .setDescription('The API description of hybrid encryption')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  Logger.log('server is running on port: ' + port);
  await app.listen(port);
}
bootstrap();
