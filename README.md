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
