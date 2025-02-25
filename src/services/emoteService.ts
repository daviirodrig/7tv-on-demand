import axios from 'axios';
import NodeCache from 'node-cache';
import { config } from '../config.js';
import {
  Emote,
  EmoteSchema,
  SevenTVEmote,
  SevenTVEmoteSet,
  SevenTVEmoteSetSchema
} from '../types/emote.js';

// Cache para armazenar os emotes
const emoteCache = new NodeCache({
  stdTTL: config.cacheTTL,
  checkperiod: 120, // Verifica expiração a cada 2 minutos
});

// Armazena todos os emotes carregados
let allEmotes: Emote[] = [];

/**
 * Busca os emotes de um emote set específico do 7TV
 * @param emoteSetId - ID do emote set do 7TV
 * @returns Lista de emotes
 */
export const fetchEmoteSet = async (emoteSetId: string): Promise<Emote[]> => {
  try {
    const response = await axios.get<unknown>(`https://7tv.io/v3/emote-sets/${emoteSetId}`);

    // Valida a resposta com Zod
    const parsedResponse = SevenTVEmoteSetSchema.safeParse(response.data);

    if (!parsedResponse.success) {
      console.error(`Erro ao validar resposta do emote set ${emoteSetId}:`, parsedResponse.error);
      return [];
    }

    const emoteSet: SevenTVEmoteSet = parsedResponse.data;

    // Mapeia os emotes para o formato interno
    return emoteSet.emotes.map(emote => mapSevenTVEmote(emote));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Erro ao buscar emote set ${emoteSetId}:`, error.message);
    } else {
      console.error(`Erro desconhecido ao buscar emote set ${emoteSetId}`);
    }
    return [];
  }
};

/**
 * Mapeia um emote do 7TV para o formato interno
 * @param emote - Emote do 7TV
 * @returns Emote no formato interno
 */
const mapSevenTVEmote = (emote: SevenTVEmote): Emote => {
  return EmoteSchema.parse({
    id: emote.id,
    name: emote.name,
    owner: emote.owner?.username || 'Desconhecido',
    visibility: emote.visibility,
    mime: emote.data.mime,
    tags: emote.tags || [],
    animated: emote.data.animated || false
  });
};

/**
 * Busca todos os emotes de todos os emote sets configurados
 * @returns Lista combinada de emotes
 */
export const fetchEmotes = async (): Promise<Emote[]> => {
  try {
    const emoteSetIds = config.emoteSetIds;

    if (emoteSetIds.length === 0) {
      console.warn('Nenhum emote set configurado. Configure EMOTE_SET_IDS no arquivo .env');
      return [];
    }

    console.log(`Buscando emotes de ${emoteSetIds.length} emote sets...`);

    // Busca emotes de todos os emote sets em paralelo
    const emoteSets = await Promise.all(
      emoteSetIds.map(id => fetchEmoteSet(id))
    );

    // Combina todos os emotes em uma única lista
    allEmotes = emoteSets.flat();

    console.log(`Total de ${allEmotes.length} emotes carregados no cache.`);

    // Armazena os emotes no cache
    for (const emote of allEmotes) {
      // Usa o nome do emote em minúsculas como chave para facilitar a busca
      emoteCache.set(emote.name.toLowerCase(), emote);
    }

    return allEmotes;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro ao buscar emotes:', error.message);
    } else {
      console.error('Erro desconhecido ao buscar emotes');
    }
    throw error;
  }
};

/**
 * Busca um emote pelo nome
 * @param emoteName - Nome do emote a ser buscado
 * @returns Emote encontrado ou null
 */
export const findEmote = async (emoteName: string): Promise<Emote | null> => {
  if (!emoteName) return null;

  // Normaliza o nome do emote (remove espaços e converte para minúsculas)
  const normalizedName = emoteName.trim().toLowerCase();

  // Verifica se o emote está no cache
  const cachedEmote = emoteCache.get<Emote>(normalizedName);
  if (cachedEmote) return cachedEmote;

  // Se não estiver no cache, verifica na lista completa (busca case-insensitive)
  const emote = allEmotes.find(e => e.name.toLowerCase() === normalizedName);

  // Se encontrou, adiciona ao cache para futuras consultas
  if (emote) {
    emoteCache.set(normalizedName, emote);
    return emote;
  }

  return null;
};

/**
 * Recarrega os emotes do cache
 * @returns Lista atualizada de emotes
 */
export const refreshEmotes = async (): Promise<Emote[]> => {
  // Limpa o cache
  emoteCache.flushAll();
  // Recarrega os emotes
  return await fetchEmotes();
};

/**
 * Obtém a URL do emote no CDN do 7TV
 * @param emoteId - ID do emote
 * @param size - Tamanho do emote (1x, 2x, 3x, 4x)
 * @param format - Formato da imagem (webp, avif, etc)
 * @returns URL do emote
 */
export const getEmoteUrl = (
  emoteId: string,
  size: '1x' | '2x' | '3x' | '4x' = '3x',
  format: 'webp' | 'avif' | 'gif' = 'webp'
): string => {
  return `${config.cdnBaseUrl}/${emoteId}/${size}.${format}`;
};

/**
 * Busca a imagem do emote diretamente do CDN do 7TV
 * @param emoteId - ID do emote
 * @param size - Tamanho do emote (1x, 2x, 3x, 4x)
 * @param format - Formato da imagem (webp, avif, etc)
 * @returns Buffer com a imagem do emote e o tipo MIME
 */
export const fetchEmoteImage = async (
  emoteId: string,
  size: '1x' | '2x' | '3x' | '4x' = '3x',
  format: 'webp' | 'avif' | 'gif' = 'webp'
): Promise<{ buffer: Buffer; contentType: string }> => {
  try {
    const url = getEmoteUrl(emoteId, size, format);
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Determina o tipo MIME com base no formato
    const contentType = format === 'webp'
      ? 'image/webp'
      : format === 'avif'
        ? 'image/avif'
        : 'image/gif';

    return {
      buffer: Buffer.from(response.data),
      contentType
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Erro ao buscar imagem do emote ${emoteId}:`, error.message);
    } else {
      console.error(`Erro desconhecido ao buscar imagem do emote ${emoteId}`);
    }
    throw error;
  }
};