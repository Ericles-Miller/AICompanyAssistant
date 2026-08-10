# AI Company Assistant

Assistente que responde perguntas de funcionários com base nos documentos internos da empresa (manuais, políticas, procedimentos, normas), usando RAG (Retrieval-Augmented Generation).

Projeto de aprendizado de **AI Engineering — Construção de Produtos com IA**. O objetivo não é construir o assistente "perfeito", é passar pelo ciclo completo de um produto de IA real: ingestão de dados → indexação → recuperação → geração → avaliação.

## Objetivos de aprendizado

Ao final, você deve entender na prática:

- Como transformar documentos não estruturados (PDF/texto) em dados consultáveis por um LLM
- Chunking: por que dividir texto importa e como isso afeta a qualidade das respostas
- Embeddings e busca semântica (similaridade vetorial) com pgvector
- Design de um pipeline RAG: retrieval → montagem de prompt → geração → citação de fonte
- Prompt engineering para respostas fundamentadas (evitar alucinação, responder "não sei" quando não há contexto)
- Onde um produto de IA tem estado (banco), onde tem lógica determinística (chunking, busca) e onde depende do modelo (geração)

## Cenário de exemplo

Empresa de engenharia com documentos como:

- Manual de segurança
- Procedimentos operacionais
- Políticas internas
- Manuais de equipamentos
- Normas e contratos
- Documentos de treinamento

Perguntas que o sistema deve responder **com base nos documentos enviados** (e citando de qual documento veio a resposta):

> "Qual é o procedimento para trabalhar em altura?"
> "Quais EPIs são obrigatórios?"
> "Qual é o procedimento em caso de acidente?"
> "Resuma as regras de segurança da empresa."

## Escopo do MVP

**Dentro do escopo (v1):**
- Upload de documentos em PDF/TXT
- Pipeline de ingestão: extração de texto → chunking → embedding → armazenamento
- Endpoint de pergunta/resposta com RAG, respondendo só com base nos documentos indexados
- Resposta cita o documento de origem
- Uma única "empresa"/coleção de documentos (sem multi-tenant)

**Fora do escopo (v1)** — guardar para depois de o core funcionar:
- Autenticação/multi-empresa
- Frontend (testar via Swagger/Postman/curl)
- Histórico de conversa multi-turn (cada pergunta é independente)
- Streaming de resposta
- OCR de PDFs escaneados (assume texto extraível)

## Stack técnica

| Camada | Escolha | Por quê |
|---|---|---|
| Backend | NestJS + TypeScript (já no repo) | Estrutura modular, bom para separar ingestão/retrieval/chat em módulos |
| Geração (LLM) | Claude (Anthropic API), modelo `claude-sonnet-5` | Qualidade de resposta e de seguir instruções de "responda só com o contexto" |
| Embeddings | Voyage AI (`voyage-3-lite` ou `voyage-3`) | Anthropic não expõe endpoint de embeddings; Voyage é a parceira recomendada |
| Banco / Vector store | PostgreSQL + extensão `pgvector` | Um único banco para dados relacionais e vetores, sem infra extra além do Postgres |
| Acesso a dados | `pg` (node-postgres) com SQL direto | Para aprender, é melhor ver o SQL da busca por similaridade do que escondê-lo atrás de um ORM |
| Parsing de PDF | `pdf-parse` | Simples, suficiente para PDFs com texto extraível |

## Arquitetura (fluxo)

```
Upload de documento
   -> extrair texto (pdf-parse)
   -> dividir em chunks (~500-800 tokens, overlap ~100)
   -> gerar embedding de cada chunk (Voyage)
   -> salvar chunk + embedding no Postgres (pgvector)

Pergunta do usuário
   -> gerar embedding da pergunta (Voyage)
   -> buscar os K chunks mais similares (pgvector, cosine similarity)
   -> montar prompt: system prompt + chunks recuperados + pergunta
   -> chamar Claude
   -> retornar resposta + lista de documentos/trechos usados como fonte
```

## Modelo de dados (mínimo)

```sql
create extension if not exists vector;

create table documents (
  id          uuid primary key default gen_random_uuid(),
  filename    text not null,
  uploaded_at timestamptz not null default now()
);

create table chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content     text not null,
  embedding   vector(1024), -- ajustar conforme dimensão do modelo Voyage escolhido
  chunk_index int not null
);

create index on chunks using hnsw (embedding vector_cosine_ops);
```

## Módulos NestJS sugeridos

```
src/
  documents/    # upload, listagem, extração de texto do PDF
  ingestion/    # chunking + geração de embeddings + persistência
  retrieval/    # busca semântica (query -> top K chunks)
  chat/         # orquestração RAG: retrieval + prompt + chamada ao Claude
  common/
    config/     # env vars (API keys, database url)
    database/   # pool de conexão pg
```

## Endpoints da API (v1)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/documents` | Upload de um PDF/TXT, dispara ingestão |
| `GET` | `/documents` | Lista documentos indexados |
| `DELETE` | `/documents/:id` | Remove documento e seus chunks |
| `POST` | `/chat` | `{ "question": "..." }` → resposta + fontes citadas |

## Setup local

`docker-compose.yml` para o Postgres com pgvector:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_company_assistant
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

`.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_company_assistant
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
```

## Roadmap (fases incrementais)

- [ ] **Fase 1 — Fundação**: subir Postgres+pgvector via Docker, criar módulo `common/database`, rodar o SQL do schema
- [ ] **Fase 2 — Ingestão**: endpoint `POST /documents`, extrair texto do PDF, salvar em `documents`
- [ ] **Fase 3 — Chunking**: dividir o texto extraído em chunks com overlap, salvar em `chunks` (ainda sem embedding)
- [ ] **Fase 4 — Embeddings**: gerar embedding de cada chunk via Voyage e preencher a coluna `embedding`
- [ ] **Fase 5 — Retrieval**: função de busca semântica (top K chunks por cosine similarity)
- [ ] **Fase 6 — RAG chat**: endpoint `POST /chat` completo, com prompt que força resposta baseada só no contexto e instrução para dizer "não sei" quando não achar nada relevante
- [ ] **Fase 7 — Citações e robustez**: resposta inclui nome do documento/trecho de origem; tratar PDF sem texto extraível; testes com perguntas fora do escopo dos documentos
- [ ] **Fase 8 — Stretch goals** (opcional, depois do core funcionar): histórico multi-turn, streaming da resposta, multi-tenant (várias empresas), autenticação, avaliação de qualidade (dataset de perguntas/respostas esperadas)

## Como validar que está "pronto" (por fase)

- Depois da Fase 4: consegue rodar uma query SQL manual e ver embeddings não nulos nos chunks
- Depois da Fase 5: dado um texto de pergunta, a busca retorna chunks visivelmente relevantes ao tema
- Depois da Fase 6: as 4 perguntas de exemplo do cenário acima retornam respostas corretas baseadas nos documentos de teste, e uma pergunta fora do escopo (ex: "qual é a capital da França?") retorna "não sei" ou equivalente, sem inventar
