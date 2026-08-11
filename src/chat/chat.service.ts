import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt-builder';

const GEMINI_MODEL = 'gemini-3.5-flash-lite';

@Injectable()
export class ChatService {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  constructor(private readonly retrievalService: RetrievalService) {}

  async ask(question: string) {
    const chunks = await this.retrievalService.search(question);

    if (chunks.length === 0) {
      return {
        answer: 'Não encontrei nenhum documento indexado para responder essa pergunta.',
        sources: [],
      };
    }

    const response = await this.ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildUserMessage(question, chunks),
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const sources = [...new Set(chunks.map((chunk) => chunk.filename))];

    return { answer: response.text, sources };
  }
}
