import { z } from 'zod';

// Schema para validação de emotes
export const EmoteSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string().default('Desconhecido'),
  visibility: z.number().optional(),
  mime: z.string().optional(),
  tags: z.array(z.string()).default([]),
  animated: z.boolean().default(false)
});

// Tipo inferido do schema
export type Emote = z.infer<typeof EmoteSchema>;

// Schema para a resposta da API do 7TV
export const SevenTVEmoteSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.object({
    username: z.string()
  }).optional(),
  visibility: z.number().optional(),
  data: z.object({
    mime: z.string().optional(),
    animated: z.boolean().optional()
  }),
  tags: z.array(z.string()).optional()
});

export type SevenTVEmote = z.infer<typeof SevenTVEmoteSchema>;

// Schema para a resposta da API do 7TV para emote sets
export const SevenTVEmoteSetSchema = z.object({
  emotes: z.array(SevenTVEmoteSchema)
});

export type SevenTVEmoteSet = z.infer<typeof SevenTVEmoteSetSchema>;

// Tipo para URLs de emotes
export type EmoteUrls = {
  '1x': string;
  '2x': string;
  '3x': string;
  '4x': string;
};

// Tipo para a resposta da API
export type EmoteResponse = {
  name: string;
  id: string;
  owner: string;
  animated: boolean;
  urls: EmoteUrls;
};

// Tipo para a resposta da listagem de emotes
export type EmoteListResponse = {
  count: number;
  emotes: Array<{
    name: string;
    id: string;
    owner: string;
    animated: boolean;
    url: string;
  }>;
};