import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExamsModule } from './exams/exams.module';
import { QuestionsModule } from './questions/questions.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ResultsModule } from './results/results.module';
import { ClassesModule } from './classes/classes.module';
import { CategoriesModule } from './categories/categories.module';
import { ParentsModule } from './parents/parents.module';
import { TranscriptsModule } from './transcripts/transcripts.module';
import { GatewayModule } from './gateway/gateway.module';
import { TeacherModule } from './teacher/teacher.module';
import { TimetableModule } from './timetable/timetable.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 30,
          },
        ],
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        DB_HOST: Joi.string().optional(),
        DB_PORT: Joi.number().port().optional(),
        DB_USERNAME: Joi.string().optional(),
        DB_PASSWORD: Joi.string().optional(),
        DB_NAME: Joi.string().optional(),
        DATABASE_URL: Joi.string().optional(),
        JWT_SECRET: Joi.string().min(64).required(),
        FRONTEND_URL: Joi.string().uri().required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
        CLOUDINARY_API_KEY: Joi.string().optional(),
        CLOUDINARY_API_SECRET: Joi.string().optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        const databaseUrl = config.get('DATABASE_URL');

        const baseConfig: any = {
          type: 'postgres',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: false,
          logging: !isProduction,
        };

        if (databaseUrl) {
          const parsed = new URL(databaseUrl);
          baseConfig.host = parsed.hostname;
          baseConfig.port = parseInt(parsed.port || '5432');
          baseConfig.username = decodeURIComponent(parsed.username);
          baseConfig.password = decodeURIComponent(parsed.password);
          baseConfig.database = parsed.pathname.replace('/', '');
        } else {
          baseConfig.host = config.get('DB_HOST');
          baseConfig.port = config.get<number>('DB_PORT');
          baseConfig.username = config.get('DB_USERNAME');
          baseConfig.password = config.get('DB_PASSWORD');
          baseConfig.database = config.get('DB_NAME');
        }

        if (isProduction) {
          baseConfig.ssl = { rejectUnauthorized: false };
          baseConfig.extra = { ssl: { rejectUnauthorized: false }, family: 4 };
        }

        return baseConfig;
      },
    }),
    AuthModule,
    UsersModule,
    ExamsModule,
    QuestionsModule,
    SubmissionsModule,
    ResultsModule,
    ClassesModule,
    CategoriesModule,
    ParentsModule,
    TranscriptsModule,
    GatewayModule,
    TeacherModule,
    TimetableModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
