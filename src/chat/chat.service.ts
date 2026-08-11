import { GoogleGenAI } from '@google/genai';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { RetrievedChunk, RetrievalService } from '../retrieval/retrieval.service';
import { UsersService } from '../users/users.service';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt-builder';

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_ANSWER = 'Não encontrei nenhum documento indexado para responder essa pergunta.';

@Injectable()
export class ChatService {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    private readonly documentsService: DocumentsService,
  ) {}

  async ask(userId: string, question: string, documentId?: string) {
    const { history, chunks } = await this.prepareTurn(userId, question, documentId);

    if (chunks.length === 0 && history.length === 0) {
      await this.messagesService.save(userId, 'assistant', FALLBACK_ANSWER);
      return { answer: FALLBACK_ANSWER, sources: [] };
    }

    const contents = this.buildContents(history, question, chunks);

    const response = await this.ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const answer = response.text ?? 'Não foi possível gerar uma resposta.';
    await this.messagesService.save(userId, 'assistant', answer);

    return { answer, sources: this.uniqueSources(chunks) };
  }

  async *askStream(
    userId: string,
    question: string,
    documentId?: string,
  ): AsyncGenerator<string, { sources: string[] }> {
    const { history, chunks } = await this.prepareTurn(userId, question, documentId);

    if (chunks.length === 0 && history.length === 0) {
      await this.messagesService.save(userId, 'assistant', FALLBACK_ANSWER);
      yield FALLBACK_ANSWER;
      return { sources: [] };
    }

    const contents = this.buildContents(history, question, chunks);

    const stream = await this.ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    let fullAnswer = '';
    for await (const chunk of stream) {
      const delta = chunk.text ?? '';
      if (delta) {
        fullAnswer += delta;
        yield delta;
      }
    }

    await this.messagesService.save(userId, 'assistant', fullAnswer);

    return { sources: this.uniqueSources(chunks) };
  }

  private async prepareTurn(userId: string, question: string, documentId?: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const history = await this.messagesService.findHistory(userId);
    await this.messagesService.save(userId, 'user', question);

    const chunks = documentId
      ? await this.findFullDocumentChunks(documentId)
      : await this.retrievalService.search(question);

    return { history, chunks };
  }

  private buildContents(history: Message[], question: string, chunks: RetrievedChunk[]) {
    const newTurnText = chunks.length > 0 ? buildUserMessage(question, chunks) : question;

    return [
      ...history.map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: newTurnText }] },
    ];
  }

  private async findFullDocumentChunks(documentId: string) {
    const document = await this.documentsService.findById(documentId);

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    return await this.retrievalService.findByDocumentId(documentId);
  }

  private uniqueSources(chunks: RetrievedChunk[]): string[] {
    return [...new Set(chunks.map((chunk) => chunk.filename))];
  }
}
