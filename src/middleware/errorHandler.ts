import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

// Interface para erros com código HTTP
export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Middleware para lidar com erros
 */
export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Obtém o código de status do erro ou usa 500 como padrão
  const statusCode = err.status || err.statusCode || 500;

  // Log do erro
  console.error(`[Erro] ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  // Resposta para o cliente
  res.status(statusCode).json({
    error: err.message,
    // Inclui o stack trace apenas em ambiente de desenvolvimento
    ...(config.isProduction ? {} : { stack: err.stack })
  });
};

/**
 * Middleware para lidar com rotas não encontradas
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
};