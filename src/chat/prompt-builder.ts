import { RetrievedChunk } from '../retrieval/retrieval.service';

export const SYSTEM_PROMPT = `Você é um assistente que responde perguntas sobre documentos internos de uma empresa.
Baseie suas respostas no CONTEXTO fornecido na pergunta atual e no histórico da conversa.
Se a pergunta for sobre a própria conversa (ex: o que foi perguntado antes), responda com base no histórico, sem exigir um CONTEXTO novo.
Se a resposta não estiver disponível nem no contexto nem no histórico, diga que não encontrou essa informação nos documentos.
Ao citar um documento, sempre informe o nome do arquivo de origem.`;

export function buildUserMessage(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((chunk, index) => `[${index + 1}] (fonte: ${chunk.filename}) ${chunk.content}`)
    .join('\n\n');

  return `CONTEXTO:\n${context}\n\nPERGUNTA: ${question}`;
}
