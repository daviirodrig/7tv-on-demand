# 7TV On Demand

Uma API moderna para buscar emotes do 7TV sob demanda, com suporte a cache para CDNs como Cloudflare.

## Funcionalidades

- Busca emotes em múltiplos emote sets do 7TV
- Retorna a imagem do emote diretamente (não redireciona)
- Fornece informações detalhadas sobre os emotes em formato JSON
- Cache otimizado para CDNs como Cloudflare
- Suporte a diferentes formatos (webp, avif, gif) e tamanhos de imagem
- Desenvolvido com TypeScript e práticas modernas

## Tecnologias

- Node.js 20+
- TypeScript
- Express.js
- pnpm (gerenciador de pacotes rápido e eficiente)
- Zod (validação de esquemas)
- Docker multi-stage build

## Requisitos

- Node.js 20+
- pnpm 8+
- Docker (opcional, para execução em contêiner)

## Configuração

1. Clone o repositório
2. Crie um arquivo `.env` na raiz do projeto (ou copie e edite o `.env.example`):

```bash
cp .env.example .env
```

3. Edite o arquivo `.env` com suas configurações:

```
# Lista de IDs de emote sets do 7TV separados por vírgula
EMOTE_SET_IDS=id1,id2,id3

# Porta em que o servidor vai rodar
PORT=3000

# Tempo de cache em segundos (1 hora por padrão)
CACHE_TTL=3600

# Ambiente (development, production, test)
NODE_ENV=development
```

### Como obter IDs de emote sets do 7TV

1. Acesse o canal na Twitch que possui os emotes que você deseja
2. Clique em um emote do 7TV
3. Na URL do emote, você encontrará o ID do emote set, por exemplo:
   `https://7tv.app/emotes/emote_id?set=emote_set_id`

## Instalação

```bash
# Instalar dependências
pnpm install

# Compilar o TypeScript
pnpm build

# Iniciar o servidor
pnpm start

# Iniciar em modo de desenvolvimento (com hot reload)
pnpm dev
```

## Uso com Docker

```bash
# Construir a imagem
docker build -t 7tv-on-demand .

# Executar o contêiner
docker run -p 3000:3000 --env-file .env 7tv-on-demand
```

## Como usar a API

### Buscar um emote (imagem)

```
GET /{nome-do-emote}
```

Parâmetros opcionais:
- `size`: Tamanho do emote (1x, 2x, 3x, 4x). Padrão: 3x
- `format`: Formato da imagem (webp, avif, gif). Padrão: webp

Exemplo:
```
GET /CatJAM?size=3x&format=webp
```

Isso retorna a imagem do emote diretamente, permitindo que seja cacheada por CDNs como Cloudflare.

### Listar todos os emotes disponíveis

```
GET /api/emotes
```

Retorna um JSON com a lista de todos os emotes disponíveis.

### Obter informações de um emote específico

```
GET /api/emote/{nome-do-emote}
```

Exemplo:
```
GET /api/emote/CatJAM
```

Retorna um JSON com informações detalhadas sobre o emote, incluindo URLs para diferentes tamanhos.

## Otimizações

- **Multi-stage build**: O Dockerfile usa multi-stage build para reduzir o tamanho da imagem final
- **Cache otimizado**: Headers de cache configurados para CDNs como Cloudflare
- **Usuário não-root**: A aplicação roda com um usuário não-root para maior segurança
- **Health check**: O contêiner inclui health check para monitoramento
- **Validação com Zod**: Validação de esquemas para maior segurança e confiabilidade

## Licença

MIT