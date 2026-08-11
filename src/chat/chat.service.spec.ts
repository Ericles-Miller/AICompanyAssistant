import { Test } from '@nestjs/testing';
import { RetrievalService } from '../retrieval/retrieval.service';
import { ChatService } from './chat.service';

const generateContentMock = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let retrievalService: { search: jest.Mock };

  beforeEach(async () => {
    retrievalService = { search: jest.fn() };
    generateContentMock.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [ChatService, { provide: RetrievalService, useValue: retrievalService }],
    }).compile();

    chatService = moduleRef.get(ChatService);
  });

  it('não chama o modelo e responde que não encontrou nada quando o retrieval não retorna chunks', async () => {
    retrievalService.search.mockResolvedValue([]);

    const result = await chatService.ask('qual e a capital da Franca?');

    expect(result).toEqual({
      answer: 'Não encontrei nenhum documento indexado para responder essa pergunta.',
      sources: [],
    });
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('monta o prompt com os chunks recuperados e retorna as fontes sem duplicatas', async () => {
    retrievalService.search.mockResolvedValue([
      { id: '1', content: 'conteudo A', filename: 'a.pdf', distance: 0.1 },
      { id: '2', content: 'conteudo B', filename: 'a.pdf', distance: 0.2 },
      { id: '3', content: 'conteudo C', filename: 'b.pdf', distance: 0.3 },
    ]);
    generateContentMock.mockResolvedValue({ text: 'resposta gerada' });

    const result = await chatService.ask('quais epis sao obrigatorios?');

    expect(result).toEqual({
      answer: 'resposta gerada',
      sources: ['a.pdf', 'b.pdf'],
    });
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});
