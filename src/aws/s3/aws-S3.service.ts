import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class AwsS3Service {
  constructor(@Inject('S3_CLIENT') private readonly s3Client: S3Client) {}

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao fazer upload para o S3, ${error}`);
    }
  }

  get(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
    await this.s3Client.send(command);
  }

  async update(key: string, body: Buffer, contentType: string): Promise<string> {
    return this.upload(key, body, contentType);
  }
}
