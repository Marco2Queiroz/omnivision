# OmniVision

Sistema de governança corporativa e gestão de crise (C-Level): **Appwrite** (auth e banco), base de conhecimento a ser alimentada por **importação Excel**, e interface executiva dark (referência em `telas omnivision/`).

## Appwrite — ping automático

Ao abrir qualquer página, o componente `AppwritePing` chama **`client.ping()`** e registra o resultado no **console do navegador** (F12 → Console): sucesso aparece como `[OmniVision] Appwrite ping OK:`.

## Requisitos

- Node 18+
- Projeto **Appwrite** (endpoint, project ID; API key + database para gestão de acesso e dados server-side)

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha variáveis.
2. No console Appwrite: adicione a URL do app em **Platforms**; crie **Database** e coleções conforme a gestão de acesso / importação Excel.
3. Em **localhost** (inclui `npm run dev` e `npm run start` na máquina), o middleware **não exige login** — `/login` redireciona para `/dashboard`. Para testar login localmente: `FORCE_LOGIN=true` no `.env.local`.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Em deploy (host diferente de localhost), a sessão Appwrite continua obrigatória para `/dashboard`.

## Variáveis de ambiente (Vercel / produção)

| Variável | Descrição |
| -------- | --------- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Ex.: `https://sfo.cloud.appwrite.io/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | ID do projeto Appwrite |
| `APPWRITE_API_KEY` | Chave de API (servidor) para listar documentos |
| `APPWRITE_DATABASE_ID` | ID do database |
| `APPWRITE_ACCESS_COLLECTION_ID` | ID da coleção de perfis de acesso (padrão: `access_profiles`) |
| `NEXT_PUBLIC_WHATSAPP_FALLBACK` | DDI+número (só dígitos) para `wa.me` |
| `FORCE_LOGIN` | `true` para **exigir** login mesmo em localhost/dev |
| `REQUIRE_AUTH_IN_DEV` | igual a forçar login (alias) |
| `OMNI_SKIP_LOGIN` | `true` para ignorar login em host não-local (uso pontual) |

## Estrutura principal

- `src/lib/appwrite.ts` — cliente Web (`Client`, `Account`, `Databases`)
- `src/lib/appwrite-server.ts` — leitura server-side com API key
- `src/app` — App Router, `api/health`, `api/access`
- `src/middleware.ts` — cookie `a_session_<projectId>` fora de localhost; em localhost, bypass salvo `FORCE_LOGIN=true`
- PWA: `public/manifest.json` (sem plugin `next-pwa` no Webpack — evita conflito com Tailwind)

## API

- `GET /api/health` — status e flags de configuração
- `GET /api/access/profiles` — perfis de acesso (servidor)

## Checklist System Health (pré-produção)

1. **Appwrite**: login, logout, recuperação (`/forgot-password` → e-mail → `/recovery`); ping no console OK.
2. **UI**: rotas `/dashboard/*` responsivas; WhatsApp com `NEXT_PUBLIC_WHATSAPP_FALLBACK` se necessário.
3. **Build**: `npm run build` sem erros; `npm run lint` limpo.
4. **PWA / install**: “Adicionar ao ecrã” via manifest; `public/sw.js` pode ser ajustado manualmente se precisares de SW.
5. **GitHub**: `.gitignore` cobre `.env*.local`, `.vercel`, artefatos de build.

## Deploy (Vercel)

Conecte o repositório e defina as ENVs. Inclua `localhost` e o domínio de produção nas **Platforms** do projeto Appwrite.
