import express from 'express';
import { config } from './config.js';
import {
  fetchEmotes,
  findEmote,
  fetchEmoteImage,
  getEmoteUrl
} from './services/emoteService.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cacheControl, imageCacheControl } from './middleware/cacheControl.js';
import type { Request, Response, NextFunction } from 'express';
import type { EmoteListResponse, EmoteResponse } from './types/emote.js';

// Cria a aplicação Express
const app = express();
const port = config.port;

// Middleware para logging básico
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware para configurar o cache-control para API JSON
app.use('/api', cacheControl(1800)); // 30 minutos

// Middleware para configurar o cache-control para imagens
app.use('/:emoteName', imageCacheControl);

// Rota para listar todos os emotes disponíveis
app.get('/api/emotes', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allEmotes = await fetchEmotes();

    // Retorna apenas as informações necessárias
    const emoteList: EmoteListResponse = {
      count: allEmotes.length,
      emotes: allEmotes.map(emote => ({
        name: emote.name,
        id: emote.id,
        owner: emote.owner,
        animated: emote.animated,
        url: getEmoteUrl(emote.id)
      }))
    };

    res.json(emoteList);
  } catch (error) {
    next(error);
  }
});

// Rota para buscar informações de um emote específico em JSON
app.get('/api/emote/:emoteName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emoteName } = req.params;

    if (!emoteName) {
      res.status(400).json({ error: 'Nome do emote não fornecido' });
      return;
    }

    // Busca o emote pelo nome
    const emote = await findEmote(emoteName);

    if (!emote) {
      res.status(404).json({ error: 'Emote não encontrado' });
      return;
    }

    // Retorna as informações do emote
    const response: EmoteResponse = {
      name: emote.name,
      id: emote.id,
      owner: emote.owner,
      animated: emote.animated,
      urls: {
        '1x': getEmoteUrl(emote.id, '1x'),
        '2x': getEmoteUrl(emote.id, '2x'),
        '3x': getEmoteUrl(emote.id, '3x'),
        '4x': getEmoteUrl(emote.id, '4x')
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Rota principal para buscar emotes (retorna a imagem diretamente)
app.get('/:emoteName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emoteName } = req.params;

    if (!emoteName) {
      res.status(400).json({ error: 'Nome do emote não fornecido' });
      return;
    }

    const size = (req.query.size as '1x' | '2x' | '3x' | '4x') || '3x';
    const format = (req.query.format as 'webp' | 'avif' | 'gif') || 'webp';

    // Busca o emote pelo nome
    const emote = await findEmote(emoteName);

    if (!emote) {
      res.status(404).json({ error: 'Emote não encontrado' });
      return;
    }

    // Busca a imagem do emote diretamente
    const { buffer, contentType } = await fetchEmoteImage(emote.id, size, format);

    // Configura os headers para a imagem
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);

    // Retorna a imagem diretamente
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Rota para a raiz
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>7TV On Demand</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #6441a5;
          }
          code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>7TV On Demand</h1>
        <p>Use esta API para buscar emotes do 7TV.</p>
        <p>Exemplo de uso: <code>GET /{nome-do-emote}</code></p>
        <p>Parâmetros opcionais: <code>size</code> (1x, 2x, 3x, 4x) e <code>format</code> (webp, avif, gif)</p>
        <p>Para listar todos os emotes disponíveis: <code>GET /api/emotes</code></p>
        <p>Para obter informações de um emote específico: <code>GET /api/emote/{nome-do-emote}</code></p>
      </body>
    </html>
  `);
});

// Middleware para lidar com rotas não encontradas
app.use(notFoundHandler);

// Middleware para lidar com erros
app.use(errorHandler);

// Inicializa o cache de emotes e inicia o servidor
(async () => {
  try {
    // Carrega os emotes no cache ao iniciar
    await fetchEmotes();

    // Inicia o servidor
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
      console.log(`Acesse: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
})();