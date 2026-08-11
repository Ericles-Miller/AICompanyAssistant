import { RetrievedChunk } from '../retrieval/retrieval.service';

export const SYSTEM_PROMPT = `Você é um assistente que responde perguntas sobre documentos internos de uma empresa.
Responda somente com base no CONTEXTO fornecido pelo usuário.
Se a resposta não estiver no contexto, diga que não encontrou essa informação nos documentos.
Sempre cite de qual documento veio a informação.`;

export function buildUserMessage(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((chunk, index) => `[${index + 1}] (fonte: ${chunk.filename}) ${chunk.content}`)
    .join('\n\n');

  return `CONTEXTO:\n${context}\n\nPERGUNTA: ${question}`;
}
