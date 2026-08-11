import { splitIntoChunks } from './text-splitter';

describe('splitIntoChunks', () => {
  it('retorna um único chunk quando o texto é menor que o tamanho máximo', () => {
    const text = 'Texto curto de teste.';

    expect(splitIntoChunks(text)).toEqual([text]);
  });

  it('retorna lista vazia para texto vazio', () => {
    expect(splitIntoChunks('')).toEqual([]);
  });

  it('mantém parágrafos curtos juntos no mesmo chunk', () => {
    const text = 'Primeiro paragrafo.\n\nSegundo paragrafo.';

    const chunks = splitIntoChunks(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain('Primeiro paragrafo.');
    expect(chunks[0]).toContain('Segundo paragrafo.');
  });

  it('divide em múltiplos chunks quando o texto ultrapassa o tamanho máximo, mantendo overlap entre eles', () => {
    const paragraph = (n: number) => `Paragrafo ${n}. ` + 'Texto de exemplo para teste de chunking. '.repeat(30);
    const text = [paragraph(1), paragraph(2), paragraph(3)].join('\n\n');

    const chunks = splitIntoChunks(text);

    expect(chunks.length).toBeGreaterThan(1);

    for (let i = 0; i < chunks.length - 1; i++) {
      const tailOfCurrent = chunks[i].slice(-50);
      expect(chunks[i + 1]).toContain(tailOfCurrent);
    }
  });

  it('quebra por frase quando um parágrafo sozinho ultrapassa o tamanho máximo', () => {
    const sentence = 'Esta e uma frase de teste para verificar a quebra por pontuacao. ';
    const text = sentence.repeat(40);

    const chunks = splitIntoChunks(text);

    expect(chunks.length).toBeGreaterThan(1);
  });
});
