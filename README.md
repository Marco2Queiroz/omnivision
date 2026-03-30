# OmniVision

Sistema de governança corporativa e gestão de crise (C-Level): consolida dados do **Jira** com **Supabase** (auth, perfis, planos Geo) e interface executiva dark (referência em `telas omnivision/`).

## Requisitos

- Node 18+
- Conta **Jira Cloud** (API token + e-mail)
- Projeto **Supabase** (URL + anon key)

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha variáveis.
2. No Supabase, execute o SQL em [`supabase/migrations/001_init_schema.sql`](supabase/migrations/001_init_schema.sql) (perfis, RLS, `planos_crise_geo`, trigger de signup).
3. Em desenvolvimento, sem Supabase, você pode usar `OMNI_DEV_SKIP_AUTH=true` para acessar o dashboard (somente dev).

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) (redireciona para `/dashboard`; sem sessão, `/login`).

## Variáveis de ambiente (Vercel / produção)

| Variável | Descrição |
| -------- | --------- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônica |
| `JIRA_HOST` | Base URL, ex. `https://empresa.atlassian.net` |
| `JIRA_EMAIL` | E-mail da conta Atlassian |
| `JIRA_API_TOKEN` | Token de API (servidor apenas) |
| `NEXT_PUBLIC_WHATSAPP_FALLBACK` | DDI+número (só dígitos) para links `wa.me` |
| `OMNI_DEV_SKIP_AUTH` | `true` só em dev para ignorar auth |

## Estrutura principal

- `src/app` — App Router: `(auth)`, `(dashboard)`, `api/jira`, `api/geo`, `api/health`
- `src/services/jira.ts` — `getJiraData` + JQL (épicos, tático, operacional)
- `src/stores/filter-store.ts` — filtros globais (Data, Projeto, Responsável)
- `src/middleware.ts` — proteção de `/dashboard`
- PWA: `@ducanh2912/next-pwa`, `public/manifest.json`

## API

- `GET /api/jira/search?jql=...` — proxy Jira (servidor)
- `GET /api/geo/plans` — planos de crise (Supabase, sessão)
- `GET /api/health` — status e flags de configuração

## Checklist System Health (pré-produção)

1. **Jira**: JQL retorna issues; paginação testada; `JIRA_*` só no servidor.
2. **Supabase**: login, logout, recuperação de senha; tabela `planos_crise_geo` com dados de teste.
3. **UI**: rotas `/dashboard/*` responsivas; botão WhatsApp abre com `wa.me` (definir `NEXT_PUBLIC_WHATSAPP_FALLBACK`).
4. **Build**: `npm run build` sem erros; TypeScript limpo (`npm run lint`).
5. **PWA**: em produção, “Instalar app” disponível; `public/sw.js` gerado no build.
6. **GitHub**: `.gitignore` cobre `.env*.local`, `.vercel`, artefatos PWA em `public/`.

## Deploy (Vercel)

- Conecte o repositório GitHub e defina as ENVs acima no painel do projeto.
- Após migrar o SQL no Supabase de produção, valide `/api/health` e um fluxo completo como Diretor.
