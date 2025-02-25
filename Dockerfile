# Estágio de build
FROM node:20-alpine AS builder

# Instala o pnpm globalmente
RUN npm install -g pnpm

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração
COPY package.json ./
COPY tsconfig.json ./
COPY pnpm-lock.yaml* ./

# Instala as dependências
RUN pnpm install

# Copia o código fonte
COPY src/ ./src/

# Compila o TypeScript
RUN npx tsc

# Estágio de produção
FROM node:20-alpine AS production

# Define variáveis de ambiente
ENV NODE_ENV=production

# Instala o pnpm globalmente
RUN npm install -g pnpm

# Cria um usuário não-root para executar a aplicação
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Instala apenas as dependências de produção
RUN pnpm install --prod

# Copia os arquivos compilados do estágio de build
COPY --from=builder /app/dist ./dist

# Copia o arquivo .env.example (se existir)
COPY .env.example .env.example

# Define o usuário não-root
USER nodejs

# Expõe a porta configurada (padrão: 3000)
EXPOSE 3000

# Configura o health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Comando para iniciar a aplicação
CMD ["node", "dist/index.js"]