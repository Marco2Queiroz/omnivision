# OmniVision

Sistema de governança corporativa e gestão de crise (C-Level): consolida dados do **Jira** com **Appwrite** (auth e banco) e interface executiva dark (referência em `telas omnivision/`).

## Appwrite — ping automático

Ao abrir qualquer página, o componente `AppwritePing` chama **`client.ping()`** e registra o resultado no **console do navegador** (F12 → Console): sucesso aparece como `[OmniVision] Appwrite ping OK:`.

## Requisitos

- Node 18+
- Conta **Jira Cloud** (API token + e-mail)
- Projeto **Appwrite** (endpoint, project ID; opcional API key + database para planos Geo)

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha variáveis.
2. No console Appwrite: adicione a URL do app em **Platforms**; crie **Database** + **Collection** para planos Geo (atributos alinhados ao uso em `/api/geo/plans`).
3. Em desenvolvimento, sem login, use `OMNI_DEV_SKIP_AUTH=true` para acessar o dashboard (somente dev).

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) (redireciona para `/dashboard`; sem sessão, `/login`).

## Variáveis de ambiente (Vercel / produção)

| Variável | Descrição |
| -------- | --------- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Ex.: `https://sfo.cloud.appwrite.io/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | ID do projeto Appwrite |
| `APPWRITE_API_KEY` | Chave de API (servidor) para listar documentos |
| `APPWRITE_DATABASE_ID` | ID do database |
| `APPWRITE_GEO_COLLECTION_ID` | ID da coleção de planos Geo |
| `JIRA_HOST` | Base URL Jira Cloud |
| `JIRA_EMAIL` | E-mail Atlassian |
| `JIRA_API_TOKEN` | Token de API (servidor apenas) |
| `NEXT_PUBLIC_WHATSAPP_FALLBACK` | DDI+número (só dígitos) para `wa.me` |
| `OMNI_DEV_SKIP_AUTH` | `true` só em dev para ignorar auth |

## Estrutura principal

- `src/lib/appwrite.ts` — cliente Web (`Client`, `Account`, `Databases`)
- `src/lib/appwrite-server.ts` — leitura server-side com API key
- `src/app` — App Router, `api/jira`, `api/geo`, `api/health`
- `src/services/jira.ts` — `getJiraData` + JQL
- `src/middleware.ts` — cookie `a_session_<projectId>` para `/dashboard`
- PWA: `@ducanh2912/next-pwa`, `public/manifest.json`

## API

- `GET /api/jira/search?jql=...` — proxy Jira (servidor)
- `GET /api/geo/plans` — documentos da coleção Geo (Appwrite + API key)
- `GET /api/health` — status e flags de configuração

## Checklist System Health (pré-produção)

1. **Jira**: JQL retorna issues; `JIRA_*` só no servidor.
2. **Appwrite**: login, logout, recuperação (`/forgot-password` → e-mail → `/recovery`); ping no console OK.
3. **UI**: rotas `/dashboard/*` responsivas; WhatsApp com `NEXT_PUBLIC_WHATSAPP_FALLBACK` se necessário.
4. **Build**: `npm run build` sem erros; `npm run lint` limpo.
5. **PWA**: em produção, “Instalar app”; `public/sw.js` no build.
6. **GitHub**: `.gitignore` cobre `.env*.local`, `.vercel`, artefatos PWA.

## Deploy (Vercel)

Conecte o repositório e defina as ENVs. Inclua `localhost` e o domínio de produção nas **Platforms** do projeto Appwrite.
