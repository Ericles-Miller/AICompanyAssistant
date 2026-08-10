import { Injectable, InternalServerErrorException } from '@nestjs/common';

const VOYAGE_MODEL = 'voyage-3.5-lite';
const VOYAGE_EMBEDDINGS_URL = 'https://api.voyageai.com/v1/embeddings';

interface VoyageEmbeddingsResponse {
  data: { embedding: number[]; index: number }[];
}

@Injectable()
export class EmbeddingsService {
  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: VOYAGE_MODEL,
        input_type: 'document',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(`Erro ao gerar embeddings na Voyage AI: ${errorBody}`);
    }

    const body = (await response.json()) as VoyageEmbeddingsResponse;

    return body.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }
}
