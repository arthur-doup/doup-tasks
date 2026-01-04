# 🚀 Doup Tasks - Documentação do Projeto

> **Fork customizado do Plane** para white-label da marca Doup.
> Repositório: https://github.com/arthur-doup/doup-tasks.git
> Produção: https://tasks.doupadvice.com

---

## 📋 Visão Geral

**Doup Tasks** é uma versão white-labeled do [Plane](https://plane.so/), um sistema de gerenciamento de projetos open-source. Este fork contém customizações de branding, cores, fontes e traduções para Português do Brasil (PT-BR).

---

## 🖥️ Ambiente de Produção

### Servidor
- **URL**: https://tasks.doupadvice.com
- **Servidor**: DoupAdvice (via Cloudflare Tunnel)
- **Porta interna**: 3010
- **Localização no servidor**: `/root/plane-new`

### Stack Docker
Gerenciado via **Docker Swarm** com o arquivo `docker-compose.tunnel.yml`:

| Serviço | Imagem | Função |
|---------|--------|--------|
| `plane-web` | `plane-web-custom:latest` | Frontend customizado |
| `plane-api` | `makeplane/plane-backend:stable` | Backend Django |
| `plane-worker` | `makeplane/plane-backend:stable` | Workers Celery |
| `plane-beat` | `makeplane/plane-backend:stable` | Scheduler |
| `plane-db` | `postgres:15.7-alpine` | PostgreSQL |
| `plane-redis` | `valkey/valkey:7.2.11-alpine` | Cache |
| `plane-mq` | `rabbitmq:3.13.6-management-alpine` | Message Queue |
| `plane-minio` | `minio/minio:latest` | Armazenamento S3 |
| `plane-proxy` | `nginx:alpine` | Reverse Proxy |

### Variáveis de Ambiente (Obrigatórias)
**IMPORTANTE**: O Docker Swarm NÃO lê `.env` automaticamente. Use `export` antes do deploy:

```bash
export POSTGRES_PASSWORD=plane
export SECRET_KEY=aJlrTNrR23FAVg9UfkdbaTZwmdRy5eSTR0T9Sn9H5q58y8Jyog
export RABBITMQ_USER=plane
export RABBITMQ_PASS=fMpLm3YBzmGNOOV29AI39pbT
export MINIO_ACCESS_KEY=nRbFHeVEiloXCH6keBbk
export MINIO_SECRET_KEY=zXpdN3oHAzioNJTOkSjBB8pGFVn5lAaYmJCJi8ft
export EMAIL_HOST_PASSWORD=Luiz223100651@
```

### Comandos de Deploy
```bash
cd /root/plane-new

# Deploy/Update
docker stack deploy -c docker-compose.tunnel.yml plane

# Parar
docker stack rm plane

# Ver status
docker service ls | grep plane

# Ver logs
docker service logs plane_plane-api --tail 50
```

### Para Rebuildar o Frontend Customizado
```bash
cd /root/plane-new
git pull
docker build -f apps/web/Dockerfile.web -t plane-web-custom:latest .
docker service update --force plane_plane-web
```

---

## 🎨 Customizações de White-Label

### Paleta de Cores Doup
```css
/* Cor Primária - Laranja */
--color-primary: #FA900F;

/* Cor Secundária - Verde Limão */
--color-secondary: #CEFF1A;
```

### Tipografia
- **Títulos**: `NewBlackTypeface-Regular` (webfont local)
- **Corpo**: `Manrope` (Google Fonts)

### Arquivos Modificados para Branding

| Arquivo | Modificação |
|---------|-------------|
| `apps/web/styles/globals.css` | Paleta de cores Doup, temas simplificados |
| `apps/web/styles/doup-fonts.css` | Fontes customizadas (Manrope + NewBlackTypeface) |
| `packages/constants/src/metadata.ts` | Nome "Doup Tasks" em metadados |
| `packages/constants/src/themes.ts` | Apenas Light, Dark e System (removido High Contrast e Custom) |
| `apps/web/app/root.tsx` | Meta tags com branding Doup |
| `apps/web/app/provider.tsx` | ThemeProvider simplificado |

### Traduções (PT-BR)
- **Arquivo**: `packages/i18n/src/locales/pt-BR/translations.ts`
- Todas as menções a "Plane" substituídas por "Doup Tasks"
- Saudações corrigidas: "Bom dia", "Boa tarde", "Boa noite", "Boa madrugada"
- Formato de data brasileiro: "Segunda-feira, 29 de Dez | 07h06"

### Componentes Modificados
| Componente | Arquivo | Modificação |
|------------|---------|-------------|
| Saudações | `apps/web/core/components/home/user-greetings.tsx` | Lógica PT-BR com emojis e formatação de data |

---

## 📁 Estrutura de Assets (Imagens/Ícones)

### Para White-Label de Logos
```
apps/web/app/assets/
├── favicon/           # Favicon e ícones do app
├── plane-logos/       # PRINCIPAL: Logos do Plane (substituir por Doup)
├── logos/             # Outros logos
├── icons/             # Ícones gerais
├── images/            # Imagens gerais
├── auth/              # Imagens de autenticação/login
├── empty-state/       # Imagens de estados vazios
├── onboarding/        # Imagens de onboarding
└── cover-images/      # Imagens de capa de projetos

apps/space/app/assets/
└── plane-logo.svg     # Logo do Space App

packages/propel/public/
└── plane-lockup-light.svg  # Logo lockup
```

---

## 📧 Configuração SMTP

**Provedor**: Zoho Mail

| Configuração | Valor |
|--------------|-------|
| `EMAIL_HOST` | smtp.zoho.eu |
| `EMAIL_PORT` | 587 |
| `EMAIL_HOST_USER` | arthur@doup.design |
| `EMAIL_FROM` | contato@doup.design |
| `EMAIL_USE_TLS` | 1 |
| `EMAIL_USE_SSL` | 0 |

---

## 🐛 Problemas Conhecidos e Soluções

### 1. Erro "fe_sendauth: no password supplied"
**Causa**: Docker Swarm não lê `.env` automaticamente.
**Solução**: Exportar variáveis com `export` antes do `docker stack deploy`.

### 2. Erro "password authentication failed for user plane"
**Causa**: Senha do PostgreSQL no volume não bate com a variável de ambiente.
**Solução**: 
```bash
docker exec -it CONTAINER_ID_DB sh
psql -U plane -d plane -c "ALTER USER plane PASSWORD 'plane';"
exit
```

### 3. Mixed Content (uploads HTTP em página HTTPS)
**Status**: Parcialmente resolvido via `sub_filter` no Nginx.
**Arquivo**: `nginx.conf` (configuração de proxy)

### 4. Serviços não iniciam corretamente
**Solução**: 
```bash
docker stack rm plane
sleep 20
docker network prune -f
# Exportar variáveis
docker stack deploy -c docker-compose.tunnel.yml plane
```

---

## 🔧 Stack Tecnológico

### Frontend
- **React 19** + **React Router 7** (modo framework)
- **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS** + CSS Modules
- **i18next** (internacionalização)

### Backend
- **Django** (Python)
- **Django REST Framework**
- **Celery** (workers assíncronos)
- **PostgreSQL 15**
- **Redis/Valkey** (cache)
- **RabbitMQ** (message broker)

### Infraestrutura
- **Docker Swarm** (orquestração)
- **Nginx** (reverse proxy)
- **MinIO** (S3-compatible storage)
- **Cloudflare Tunnel** (exposição segura)

---

## 📂 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.tunnel.yml` | Stack principal para produção |
| `nginx.conf` | Configuração do proxy reverso |
| `.env.prod` | Variáveis de ambiente de produção (NÃO commitar) |
| `apps/web/Dockerfile.web` | Dockerfile para build customizado |

---

## 🚀 Comandos Úteis

### Desenvolvimento Local
```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev
```

### Git
```bash
# Commitar e enviar alterações
git add -A
git commit -m "mensagem"
git push origin main
```

### No Servidor
```bash
# Atualizar código
cd /root/plane-new && git pull

# Rebuild e deploy
docker build -f apps/web/Dockerfile.web -t plane-web-custom:latest .
docker service update --force plane_plane-web

# Ver logs em tempo real
docker service logs -f plane_plane-api
```

---

## 📝 Notas para Agentes LLM

1. **Este é um FORK** do Plane, não o projeto original
2. **Branding**: Todas as menções a "Plane" devem ser "Doup Tasks"
3. **Idioma principal**: Português do Brasil (PT-BR)
4. **Deploy**: Docker Swarm (não Docker Compose regular)
5. **Variáveis de ambiente**: Devem ser exportadas manualmente via `export`
6. **Senha do PostgreSQL**: Atualmente é `plane` (simples)
7. **Frontend customizado**: Requer rebuild da imagem Docker após alterações

---

*Última atualização: 02/01/2026*
