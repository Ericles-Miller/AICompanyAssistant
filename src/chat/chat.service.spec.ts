import { Test } from '@nestjs/testing';
import { DocumentsService } from '../documents/documents.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { MessagesService } from './messages.service';

const USER_ID = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
const DOCUMENT_ID = 'f1e2d3c4-b5a6-4a5b-8c9d-0e1f2a3b4c5d';

const generateContentMock = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let retrievalService: { search: jest.Mock; findByDocumentId: jest.Mock };
  let usersService: { findById: jest.Mock };
  let messagesService: { findHistory: jest.Mock; save: jest.Mock };
  let documentsService: { findById: jest.Mock };

  beforeEach(async () => {
    retrievalService = { search: jest.fn(), findByDocumentId: jest.fn() };
    usersService = { findById: jest.fn().mockResolvedValue({ id: USER_ID, name: 'Teste' }) };
    messagesService = { findHistory: jest.fn().mockResolvedValue([]), save: jest.fn() };
    documentsService = { findById: jest.fn().mockResolvedValue({ id: DOCUMENT_ID, filename: 'doc.pdf' }) };
    generateContentMock.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: RetrievalService, useValue: retrievalService },
        { provide: UsersService, useValue: usersService },
        { provide: MessagesService, useValue: messagesService },
        { provide: DocumentsService, useValue: documentsService },
      ],
    }).compile();

    chatService = moduleRef.get(ChatService);
  });

  it('lança NotFoundException quando o usuário não existe', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(chatService.ask(USER_ID, 'qualquer pergunta')).rejects.toThrow('Usuário não encontrado');
  });

  it('não chama o modelo e responde que não encontrou nada quando não há chunks nem histórico', async () => {
    retrievalService.search.mockResolvedValue([]);

    const result = await chatService.ask(USER_ID, 'qual e a capital da Franca?');

    expect(result).toEqual({
      answer: 'Não encontrei nenhum documento indexado para responder essa pergunta.',
      sources: [],
    });
    expect(generateContentMock).not.toHaveBeenCalled();
    expect(messagesService.save).toHaveBeenCalledWith(USER_ID, 'assistant', result.answer);
  });

  it('chama o modelo com o histórico mesmo sem chunks novos, quando já existe conversa', async () => {
    retrievalService.search.mockResolvedValue([]);
    messagesService.findHistory.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'quais linguagens aparecem no curriculo?', createdAt: new Date() },
      { id: 'm2', role: 'assistant', content: 'TypeScript, JavaScript e Python.', createdAt: new Date() },
    ]);
    generateContentMock.mockResolvedValue({ text: 'A primeira foi sobre linguagens de programação.' });

    const result = await chatService.ask(USER_ID, 'qual foi a primeira coisa que eu perguntei?');

    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(result.answer).toBe('A primeira foi sobre linguagens de programação.');
  });

  it('monta o prompt com os chunks recuperados e retorna as fontes sem duplicatas', async () => {
    retrievalService.search.mockResolvedValue([
      { id: '1', content: 'conteudo A', filename: 'a.pdf', distance: 0.1 },
      { id: '2', content: 'conteudo B', filename: 'a.pdf', distance: 0.2 },
      { id: '3', content: 'conteudo C', filename: 'b.pdf', distance: 0.3 },
    ]);
    generateContentMock.mockResolvedValue({ text: 'resposta gerada' });

    const result = await chatService.ask(USER_ID, 'quais epis sao obrigatorios?');

    expect(result).toEqual({
      answer: 'resposta gerada',
      sources: ['a.pdf', 'b.pdf'],
    });
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('inclui o histórico da conversa na chamada ao modelo', async () => {
    messagesService.findHistory.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'pergunta anterior', createdAt: new Date() },
      { id: 'm2', role: 'assistant', content: 'resposta anterior', createdAt: new Date() },
    ]);
    retrievalService.search.mockResolvedValue([{ id: '1', content: 'conteudo A', filename: 'a.pdf', distance: 0.1 }]);
    generateContentMock.mockResolvedValue({ text: 'resposta nova' });

    await chatService.ask(USER_ID, 'pergunta de acompanhamento');

    const callArgs = generateContentMock.mock.calls[0][0];
    expect(callArgs.contents[0]).toEqual({ role: 'user', parts: [{ text: 'pergunta anterior' }] });
    expect(callArgs.contents[1]).toEqual({ role: 'model', parts: [{ text: 'resposta anterior' }] });
    expect(callArgs.contents).toHaveLength(3);
  });

  it('usa o documento inteiro como contexto quando documentId é informado, em vez de buscar por similaridade', async () => {
    retrievalService.findByDocumentId.mockResolvedValue([
      { id: '1', content: 'trecho 1', filename: 'doc.pdf' },
      { id: '2', content: 'trecho 2', filename: 'doc.pdf' },
    ]);
    generateContentMock.mockResolvedValue({ text: 'quiz gerado' });

    const result = await chatService.ask(USER_ID, 'crie um quiz sobre esse documento', DOCUMENT_ID);

    expect(documentsService.findById).toHaveBeenCalledWith(DOCUMENT_ID);
    expect(retrievalService.findByDocumentId).toHaveBeenCalledWith(DOCUMENT_ID);
    expect(retrievalService.search).not.toHaveBeenCalled();
    expect(result).toEqual({ answer: 'quiz gerado', sources: ['doc.pdf'] });
  });

  it('lança NotFoundException quando o documentId informado não existe', async () => {
    documentsService.findById.mockResolvedValue(null);

    await expect(chatService.ask(USER_ID, 'crie um quiz', DOCUMENT_ID)).rejects.toThrow('Documento não encontrado');
  });
});
