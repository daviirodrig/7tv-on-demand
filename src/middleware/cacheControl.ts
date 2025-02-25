import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para configurar o cache-control
 * @param maxAge - Tempo máximo de cache em segundos
 */
export const cacheControl = (maxAge: number = 3600) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Configura o cache-control
    res.setHeader('Cache-Control', `max-age=${maxAge}`);

    // Configura o Vary para informar que a resposta pode variar de acordo com o Accept
    res.setHeader('Vary', 'Accept');

    next();
  };
};

/**
 * Middleware para configurar o cache-control para imagens
 * Otimizado para CDNs como Cloudflare
 */
export const imageCacheControl = (req: Request, res: Response, next: NextFunction) => {
  // Cache por 7 dias para imagens
  const maxAge = 60 * 60 * 24 * 7;

  // Configura o cache-control otimizado para CDNs
  res.setHeader('Cache-Control', `max-age=${maxAge}`);

  // Configura o Vary para informar que a resposta pode variar de acordo com o Accept
  res.setHeader('Vary', 'Accept');

  next();
};