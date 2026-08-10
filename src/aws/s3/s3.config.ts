import { S3Client } from '@aws-sdk/client-s3';

export class S3Config {
  private s3Client: S3Client;

  constructor(
    private region: string = process.env.AWS_REGION || 'us-east-1',
    private accessKeyId: string = process.env.AWS_ACCESS_KEY_ID!,
    private secretAccessKey: string = process.env.AWS_SECRET_ACCESS_KEY!,
  ) {
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  getClient(): S3Client {
    return this.s3Client;
  }
}
