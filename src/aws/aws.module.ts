import { Module } from '@nestjs/common';
import { S3Config } from './s3/s3.config';
import { AwsS3Service } from './s3/aws-S3.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    AwsS3Service,
    {
      provide: 'S3_CLIENT',
      useFactory: () => {
        const config = new S3Config(
          process.env.AWS_REGION,
          process.env.AWS_ACCESS_KEY_ID,
          process.env.AWS_SECRET_ACCESS_KEY,
        );
        return config.getClient();
      },
    },
  ],
  exports: [AwsS3Service],
})
export class AwsModule {}