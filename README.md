#  Planner Virtual - Produtividade & Organização

Projeto final desenvolvido para a disciplina de **Paradigmas de Linguagens de Programação** na **Universidade Federal do Agreste de Pernambuco (UFAPE)**.

 **Professor:** Dimas Cassimiro do Nascimento Filho

## 👥 Equipe (7 Participantes)
1. **[Arthur Oliveira Ramos](https://github.com/thuramos)**
2. **[Alvaro](Link_do_GitHub)**
3. **[Carlos Gabryel Alves Espinhara](https://github.com/cgabryel0)**
4. **[Carlos Lucas Feitoza](Link_do_GitHub)**
5. **[Maria Heoísa da Silva Montebelo](Link_do_GitHub)**
6. **[Laura Vitória Mendes](Link_do_GitHub)**
7. **[Riana](Link_do_GitHub)**

---

##  Visão Geral do Sistema
O **Planner Virtual** é uma aplicação focada em maximizar a organização pessoal através de uma interface **altamente visual, moderna e intuitiva**. Sabendo que a apresentação visual e a experiência do usuário são cruciais, o sistema conta com um Painel Analítico rico, categorização em cores e feedback imediato de produtividade.

##  Funcionalidades Principais (Meta de Funcionalidades)

*    **Painel Analítico (Dashboard):** Visão geral do dia com tarefas pendentes, metas em andamento, lembretes próximos e um **Indicador Geral de Produtividade** em formato de gráfico.
*    **Gestão de Tarefas (Time-blocking):** Criação de tarefas divididas por blocos de tempo (30 min, 1h) ou turnos.
*    **Categorização Visual (Cores):** Tarefas e metas coloridas por categoria (Faculdade, Trabalho, Saúde, Lazer, Projetos Pessoais, Estudos) para rápida identificação.
*    **Metas Estratégicas:** Definição de metas para a semana, mês e ano, com status de progressão (Cumprida, Parcialmente, Não cumprida).
*    **Lembretes Inteligentes:** Alertas únicos ou recorrentes para reuniões, compras, exercícios, etc.
*    **Relatórios de Desempenho:** Geração de estatísticas mostrando as semanas, meses e turnos mais produtivos.

---

##  Stack Tecnológica & Arquitetura

Como padrão adotado pela equipe (conforme projetos anteriores modulares):
*   **Frontend:** `TypeScript` (React) + `Tailwind CSS` (Garante uma interface extremamente bonita e responsiva).
*   **Backend:** `Node.js` + `Express` (Arquitetura em camadas: Controllers, Services, Routes, usando DTOs para tráfego seguro).
*   **Armazenamento:** Persistência de dados (Banco de dados relacional / Arquivos JSON).

---

## Rodar e publicar

Local, com Docker (sobe front e back juntos):

```bash
docker compose up -d --build
```

App em <http://localhost:8090>, API direta em <http://localhost:3100>. As portas
são diferentes das de desenvolvimento (5173 e 3000) para os dois conviverem.

### Railway

Dois serviços a partir deste repositório. O que muda entre eles é o **Root
Directory**; cada um já traz `Dockerfile` e `railway.json`.

Some um serviço de **PostgreSQL** do próprio Railway e ligue-o ao backend.

| Serviço | Root Directory | Config file | Variáveis |
|---|---|---|---|
| backend | `/backend` | `/backend/railway.json` | `DATABASE_URL` (vem do Postgres ao ligar os serviços), `AUTH_SECRET` |
| frontend | `/frontend` | `/frontend/railway.json` | `API_URL=https://SEU-BACKEND.up.railway.app` (sem `/api` no fim) |

`PORT` é injetada pelo Railway nos dois; não defina à mão. Se o banco estiver
fora da rede interna do Railway, acrescente `PGSSL=require` no backend.
Use um `AUTH_SECRET` longo e aleatório no backend (por exemplo, 32 caracteres ou
mais); ele assina o cookie de sessão dos usuários.

Passo a passo no Railway:

1. Crie um projeto e adicione um serviço **PostgreSQL**.
2. Adicione um serviço pelo GitHub apontando para este repositório.
3. No serviço do backend, configure **Root Directory** como `/backend` e
   **Config File Path** como `/backend/railway.json`.
4. Conecte o Postgres ao backend para expor `DATABASE_URL` e crie `AUTH_SECRET`.
5. Adicione outro serviço pelo mesmo repositório para o frontend.
6. No serviço do frontend, configure **Root Directory** como `/frontend` e
   **Config File Path** como `/frontend/railway.json`.
7. Depois que o backend tiver domínio público, configure no frontend
   `API_URL=https://SEU-BACKEND.up.railway.app` e redeploy.

Três pontos que não são adivinháveis:

- **Sem banco, o app cai para arquivo JSON.** É o modo local de quem roda sem
  Docker. Em hospedagem isso perderia tudo a cada publicação, porque o disco do
  contêiner é efêmero: é justamente por isso que existe o Postgres. O esquema é
  aplicado sozinho na subida.
- **O fuso vai na imagem** (`TZ=America/Recife`, já no Dockerfile). Um contêiner
  sobe em UTC, e o backend calcula "hoje" pela hora local: sem isso, os
  lembretes de hoje somem toda noite a partir das 21h.
- **O frontend não chama o backend direto.** Ele pede `/api` na própria origem e
  o nginx repassa, o mesmo desenho do proxy do Vite em desenvolvimento. Por isso
  a URL do backend não fica compilada no bundle e não há CORS para configurar.
