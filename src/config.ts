import { z } from 'zod';
import 'dotenv/config';

// Schema para validação das variáveis de ambiente
const EnvSchema = z.object({
  EMOTE_SET_IDS: z.string().default(''),
  PORT: z.string().default('3000'),
  CACHE_TTL: z.string().default('3600'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

// Valida e extrai as variáveis de ambiente
const env = EnvSchema.parse(process.env);

/**
 * Obtém os IDs dos emote sets configurados no arquivo .env
 * @returns Lista de IDs dos emote sets
 */
export const getEmoteSetIds = (): string[] => {
  // Divide a string por vírgula e remove espaços em branco
  return env.EMOTE_SET_IDS
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);
};

/**
 * Obtém a porta configurada para o servidor
 * @returns Número da porta
 */
export const getPort = (): number => {
  return parseInt(env.PORT, 10);
};

/**
 * Obtém o tempo de vida do cache em segundos
 * @returns Tempo de vida em segundos
 */
export const getCacheTTL = (): number => {
  return parseInt(env.CACHE_TTL, 10);
};

/**
 * Verifica se o ambiente é de produção
 * @returns true se for produção, false caso contrário
 */
export const isProduction = (): boolean => {
  return env.NODE_ENV === 'production';
};

// Configuração exportada como objeto
export const config = {
  emoteSetIds: getEmoteSetIds(),
  port: getPort(),
  cacheTTL: getCacheTTL(),
  isProduction: isProduction(),
  cdnBaseUrl: 'https://cdn.7tv.app/emote'
};