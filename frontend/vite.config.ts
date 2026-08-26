import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    /*
     * `host: true` escuta em todas as interfaces, e nao so em localhost, para
     * dar para abrir o app no celular pela rede local.
     */
    host: true,
    /*
     * O front chama `/api/...` na PROPRIA origem e o Vite repassa ao backend.
     *
     * Isso resolve dois problemas de uma vez. No celular, "localhost" e o
     * proprio celular - um endereco fixo de localhost:3000 nunca acharia o
     * servidor. E como a requisicao sai da mesma origem, nao ha CORS para
     * configurar no backend.
     */
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
