import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { otelSDK } from './tracing';
import { Discovery } from './consul';
import process from 'process';

async function bootstrap() {
  await otelSDK.start();

  const consul = new Discovery({
    host: 'consul',
    port: '8500',
    secure: false,
  });

  await consul.register({
    node: 'todo-service',
    address: 'app',
    service: {
      service: 'todo-service',
      tags: ['todo'],
      address: 'app',
      port: 3000,
    },
    check: {
      node: 'todo-service',
      name: 'todo-service',
      definition: {
        http: 'http://app:3000/health',
        interval: '10s',
        tlsskipverify: false,
        timeout: '5s',
      },
    },
  });

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Todo service')
    .setDescription('The todo services handle todos for you.')
    .setVersion('1.0')
    .addTag('todo')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

  process.on('SIGTERM', () => {
    consul
      .shutdown()
      .then(
        () => console.log('Consul service unregister successfully'),
        (err) =>
          console.log('Error while unregister service from Consul.', err),
      )
      .finally(() => process.exit(0));
  });
}
bootstrap();
