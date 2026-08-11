import { GoogleGenAI } from '@google/genai';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { UsersService } from '../users/users.service';
import { MessagesService } from './messages.service';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt-builder';

const GEMINI_MODEL = 'gemini-3.5-flash-lite';

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
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const history = await this.messagesService.findHistory(userId);
    await this.messagesService.save(userId, 'user', question);

    const chunks = documentId
      ? await this.findFullDocumentChunks(documentId)
      : await this.retrievalService.search(question);

    if (chunks.length === 0 && history.length === 0) {
      const answer = 'Não encontrei nenhum documento indexado para responder essa pergunta.';
      await this.messagesService.save(userId, 'assistant', answer);

      return { answer, sources: [] };
    }

    const newTurnText = chunks.length > 0 ? buildUserMessage(question, chunks) : question;

    const contents = [
      ...history.map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: newTurnText }] },
    ];

    const response = await this.ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const answer = response.text ?? 'Não foi possível gerar uma resposta.';
    await this.messagesService.save(userId, 'assistant', answer);

    const sources = [...new Set(chunks.map((chunk) => chunk.filename))];

    return { answer, sources };
  }

  private async findFullDocumentChunks(documentId: string) {
    const document = await this.documentsService.findById(documentId);

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    return await this.retrievalService.findByDocumentId(documentId);
  }
}
