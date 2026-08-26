import { Router } from "express";
import { AuthService, emitirToken } from "../services/AuthService";
import { DEFAULT_CATEGORIES } from "../services/CategoryService";
import {
  gravarCookieDeSessao,
  limparCookieDeSessao,
  usuarioDaRequisicao,
} from "../middleware/sessao";
import { AppError, asyncHandler } from "../utils/errors";

export function createAuthRouter(authService = new AuthService()): Router {
  const router = Router();

  router.post(
    "/registrar",
    asyncHandler(async (req, res) => {
      const usuario = await authService.registrar(req.body);

      await authService.semearCategorias(
        usuario.id,
        DEFAULT_CATEGORIES.map((c) => ({
          name: c.name,
          color: c.color as string,
        }))
      );

      gravarCookieDeSessao(res, emitirToken(usuario.id));
      res.status(201).json({ success: true, data: usuario });
    })
  );

  router.post(
    "/entrar",
    asyncHandler(async (req, res) => {
      const usuario = await authService.entrar(req.body);
      gravarCookieDeSessao(res, emitirToken(usuario.id));
      res.json({ success: true, data: usuario });
    })
  );

  router.post("/sair", (_req, res) => {
    limparCookieDeSessao(res);
    res.json({ success: true });
  });

  router.get(
    "/eu",
    asyncHandler(async (req, res) => {
      const id = usuarioDaRequisicao(req);
      const usuario = id ? await authService.porId(id) : undefined;
      if (!usuario) throw new AppError("Faça login para continuar", 401);

      res.json({ success: true, data: usuario });
    })
  );

  router.put(
    "/eu",
    asyncHandler(async (req, res) => {
      const id = usuarioDaRequisicao(req);
      if (!id) throw new AppError("Faça login para continuar", 401);

      res.json({
        success: true,
        data: await authService.atualizarPerfil(id, req.body),
      });
    })
  );

  router.put(
    "/eu/senha",
    asyncHandler(async (req, res) => {
      const id = usuarioDaRequisicao(req);
      if (!id) throw new AppError("Faça login para continuar", 401);

      await authService.trocarSenha(id, req.body);
      res.json({ success: true });
    })
  );

  return router;
}

export default createAuthRouter();
