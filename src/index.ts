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

// Função auxiliar para processar requisições de emotes
const handleEmoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
  emoteName: string,
  format: 'webp' | 'avif' | 'gif' = 'webp'
): Promise<void> => {
  try {
    if (!emoteName) {
      res.status(400).json({ error: 'Nome do emote não fornecido' });
      return;
    }

    const size = (req.query.size as '1x' | '2x' | '3x' | '4x') || '3x';

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
};

// Rota para emotes com extensão .webp
app.get('/:emoteName.webp', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const emoteName = req.params.emoteName || '';
  await handleEmoteRequest(req, res, next, emoteName, 'webp');
});

// Rota para emotes com extensão .avif
app.get('/:emoteName.avif', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const emoteName = req.params.emoteName || '';
  await handleEmoteRequest(req, res, next, emoteName, 'avif');
});

// Rota para emotes com extensão .gif
app.get('/:emoteName.gif', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const emoteName = req.params.emoteName || '';
  await handleEmoteRequest(req, res, next, emoteName, 'gif');
});

// Rota principal para buscar emotes (retorna a imagem diretamente)
app.get('/:emoteName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const emoteName = req.params.emoteName || '';
  const format = (req.query.format as 'webp' | 'avif' | 'gif') || 'webp';

  // Verifica se o cliente aceita HTML (como navegadores e Discord)
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/html')) {
    try {
      // Busca o emote pelo nome
      const emote = await findEmote(emoteName);

      if (!emote) {
        res.status(404).json({ error: 'Emote não encontrado' });
        return;
      }

      // Constrói URLs absolutos para os metadados
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/${emoteName}.${emote.animated ? 'gif' : 'webp'}`;
      const apiUrl = `${baseUrl}/api/emote/${emoteName}`;

      // Retorna uma página HTML com metadados Open Graph para o Discord
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${emoteName} - 7TV On Demand</title>
            <meta property="og:title" content="${emoteName} - 7TV Emote" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="${baseUrl}/${emoteName}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:image:alt" content="${emoteName} emote" />
            <meta property="og:description" content="7TV emote: ${emoteName}" />
            <meta property="og:site_name" content="7TV On Demand" />
            <meta name="theme-color" content="#6441a5" />
            <meta http-equiv="refresh" content="0;url=${imageUrl}">
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
              }
              img {
                max-width: 100%;
                margin: 20px 0;
              }
              .info {
                margin-top: 20px;
                color: #666;
              }
              a {
                color: #6441a5;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <h1>${emoteName}</h1>
            <img src="${imageUrl}" alt="${emoteName} emote" />
            <div class="info">
              <p>Este é um emote do 7TV.</p>
              <p><a href="${apiUrl}">Ver informações do emote em JSON</a></p>
              <p><a href="${baseUrl}">Voltar para a página inicial</a></p>
            </div>
          </body>
        </html>
      `);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Se não for uma solicitação de HTML, continua com o comportamento normal
  await handleEmoteRequest(req, res, next, emoteName, format);
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
        <p>Exemplos de uso:</p>
        <ul>
          <li><code>GET /{nome-do-emote}</code> - Retorna o emote como imagem</li>
          <li><code>GET /{nome-do-emote}.webp</code> - Retorna o emote como WebP</li>
          <li><code>GET /{nome-do-emote}.avif</code> - Retorna o emote como AVIF</li>
          <li><code>GET /{nome-do-emote}.gif</code> - Retorna o emote como GIF (se for animado)</li>
        </ul>
        <p>Parâmetros opcionais: <code>size</code> (1x, 2x, 3x, 4x)</p>
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