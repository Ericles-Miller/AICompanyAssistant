const CHUNK_SIZE = 2000; // ~500 tokens (aproximação: ~4 caracteres por token)
const CHUNK_OVERLAP = 300; // ~15% do tamanho do chunk

function splitByParagraph(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function splitBySentence(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function hardSplit(text: string): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    parts.push(text.slice(i, i + CHUNK_SIZE));
  }
  return parts;
}

function splitIntoUnits(text: string): string[] {
  const units: string[] = [];

  for (const paragraph of splitByParagraph(text)) {
    if (paragraph.length <= CHUNK_SIZE) {
      units.push(paragraph);
      continue;
    }

    for (const sentence of splitBySentence(paragraph)) {
      if (sentence.length <= CHUNK_SIZE) {
        units.push(sentence);
      } else {
        units.push(...hardSplit(sentence));
      }
    }
  }

  return units;
}

function packUnitsIntoChunks(units: string[]): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const unit of units) {
    const candidate = current ? `${current} ${unit}` : unit;

    if (candidate.length <= CHUNK_SIZE) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    const overlapText = current.slice(-CHUNK_OVERLAP);
    current = overlapText ? `${overlapText} ${unit}` : unit;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function splitIntoChunks(text: string): string[] {
  return packUnitsIntoChunks(splitIntoUnits(text));
}
