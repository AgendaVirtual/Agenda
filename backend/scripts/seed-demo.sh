#!/bin/bash
# Popula o sistema com um mes de dados plausiveis para a APRESENTACAO.
# Sem isso o painel e os relatorios abrem zerados e o projeto parece quebrado.
# Uso: subir o backend (npm run dev) e rodar: bash scripts/seed-demo.sh
API=localhost:3000/api
ids=$(curl -s $API/categories | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(' '.join(c['id'] for c in d))
")
set -- $ids
FAC=$1; TRA=$2; SAU=$3; LAZ=$4; PRO=$5; EST=$6
today=$(date +%Y-%m-%d)

mk_task () { curl -s -X POST $API/tasks -H 'Content-Type: application/json' -d "$1" > /dev/null; }
mk_goal () { curl -s -X POST $API/goals -H 'Content-Type: application/json' -d "$1" > /dev/null; }

# --- tarefas de hoje, cobrindo os tres blocos de tempo e os tres turnos ---
mk_task "{\"description\":\"Revisar slides da apresentação de PLP\",\"categoryId\":\"$FAC\",\"date\":\"$today\",\"timeBlockType\":\"UMA_HORA\",\"time\":\"08:00\",\"priority\":\"ALTA\"}"
mk_task "{\"description\":\"Reunião de alinhamento do grupo\",\"categoryId\":\"$FAC\",\"date\":\"$today\",\"timeBlockType\":\"MEIA_HORA\",\"time\":\"10:30\",\"priority\":\"ALTA\"}"
mk_task "{\"description\":\"Academia\",\"categoryId\":\"$SAU\",\"date\":\"$today\",\"timeBlockType\":\"UMA_HORA\",\"time\":\"07:00\",\"priority\":\"MEDIA\"}"
mk_task "{\"description\":\"Responder e-mails do estágio\",\"categoryId\":\"$TRA\",\"date\":\"$today\",\"timeBlockType\":\"MEIA_HORA\",\"time\":\"14:00\",\"priority\":\"MEDIA\"}"
mk_task "{\"description\":\"Estudar paradigma funcional\",\"categoryId\":\"$EST\",\"date\":\"$today\",\"timeBlockType\":\"TURNO\",\"shift\":\"TARDE\",\"priority\":\"ALTA\"}"
mk_task "{\"description\":\"Série com a família\",\"categoryId\":\"$LAZ\",\"date\":\"$today\",\"timeBlockType\":\"TURNO\",\"shift\":\"NOITE\",\"priority\":\"BAIXA\"}"
mk_task "{\"description\":\"Commit da tela de metas\",\"categoryId\":\"$PRO\",\"date\":\"$today\",\"timeBlockType\":\"UMA_HORA\",\"time\":\"20:00\",\"priority\":\"ALTA\"}"

# --- historico do mes, para o relatorio nao sair zerado ---
for d in 03 04 05 10 11 12 17 18 19; do
  mk_task "{\"description\":\"Bloco de estudos $d\",\"categoryId\":\"$EST\",\"date\":\"2026-08-$d\",\"timeBlockType\":\"TURNO\",\"shift\":\"MANHA\",\"priority\":\"MEDIA\"}"
  mk_task "{\"description\":\"Trabalho $d\",\"categoryId\":\"$TRA\",\"date\":\"2026-08-$d\",\"timeBlockType\":\"TURNO\",\"shift\":\"TARDE\",\"priority\":\"ALTA\"}"
done

mk_goal "{\"description\":\"Entregar o projeto de PLP funcionando\",\"categoryId\":\"$FAC\",\"period\":\"SEMANAL\",\"startDate\":\"$today\",\"endDate\":\"$(date -v+6d +%Y-%m-%d)\"}"
mk_goal "{\"description\":\"Fechar o mês sem atraso em nenhuma disciplina\",\"categoryId\":\"$FAC\",\"period\":\"MENSAL\",\"startDate\":\"2026-08-01\",\"endDate\":\"2026-08-31\"}"
mk_goal "{\"description\":\"Ler 12 livros no ano\",\"categoryId\":\"$LAZ\",\"period\":\"ANUAL\",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\"}"
mk_goal "{\"description\":\"Treinar 3x por semana\",\"categoryId\":\"$SAU\",\"period\":\"SEMANAL\",\"startDate\":\"2026-08-17\",\"endDate\":\"2026-08-23\"}"
mk_goal "{\"description\":\"Terminar a leitura do capítulo de paradigmas\",\"categoryId\":\"$EST\",\"period\":\"SEMANAL\",\"startDate\":\"$today\",\"endDate\":\"$(date -v+6d +%Y-%m-%d)\"}"
mk_goal "{\"description\":\"Fechar o mês sem hora extra no estágio\",\"categoryId\":\"$TRA\",\"period\":\"MENSAL\",\"startDate\":\"2026-08-01\",\"endDate\":\"2026-08-31\"}"
mk_goal "{\"description\":\"Publicar 4 projetos pessoais no GitHub\",\"categoryId\":\"$PRO\",\"period\":\"ANUAL\",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\"}"

# --- lembretes: uma semana plausivel de um estudante ---
mk_rem () { curl -s -X POST $API/reminders -H 'Content-Type: application/json' -d "$1" > /dev/null; }

# recorrentes (0=domingo ... 6=sabado)
mk_rem "{\"description\":\"Reunião semanal do grupo de PLP\",\"type\":\"REUNIAO\",\"recurrence\":\"RECORRENTE_SEMANAL\",\"dayOfWeek\":1,\"time\":\"19:00\"}"
mk_rem "{\"description\":\"Treino na academia\",\"type\":\"EXERCICIO\",\"recurrence\":\"RECORRENTE_SEMANAL\",\"dayOfWeek\":2,\"time\":\"07:00\"}"
mk_rem "{\"description\":\"Monitoria de Estruturas de Dados\",\"type\":\"ESTUDO\",\"recurrence\":\"RECORRENTE_SEMANAL\",\"dayOfWeek\":3,\"time\":\"16:00\"}"
mk_rem "{\"description\":\"Ligar para a coordenação\",\"type\":\"LIGACAO\",\"recurrence\":\"RECORRENTE_SEMANAL\",\"dayOfWeek\":4,\"time\":\"09:30\"}"
mk_rem "{\"description\":\"Feira e compras da semana\",\"type\":\"COMPRA\",\"recurrence\":\"RECORRENTE_SEMANAL\",\"dayOfWeek\":6,\"time\":\"10:00\"}"

# unicos, espalhados pelos proximos dias
mk_rem "{\"description\":\"Entregar o relatório da disciplina\",\"type\":\"ENTREGA\",\"recurrence\":\"UNICO\",\"date\":\"$(date -v+3d +%Y-%m-%d)\",\"time\":\"23:59\"}"
mk_rem "{\"description\":\"Enviar o formulário de matrícula\",\"type\":\"ENTREGA\",\"recurrence\":\"UNICO\",\"date\":\"$(date -v+1d +%Y-%m-%d)\",\"time\":\"18:00\"}"
mk_rem "{\"description\":\"Reunião com o orientador\",\"type\":\"REUNIAO\",\"recurrence\":\"UNICO\",\"date\":\"$(date -v+2d +%Y-%m-%d)\",\"time\":\"14:00\"}"
mk_rem "{\"description\":\"Comprar material para a apresentação\",\"type\":\"COMPRA\",\"recurrence\":\"UNICO\",\"date\":\"$(date -v+4d +%Y-%m-%d)\",\"time\":\"11:00\"}"
mk_rem "{\"description\":\"Revisar o slide final com o grupo\",\"type\":\"ESTUDO\",\"recurrence\":\"UNICO\",\"date\":\"$(date -v+5d +%Y-%m-%d)\",\"time\":\"20:00\"}"

# marca alguns como executados/cumpridos para as taxas nao saírem em zero
python3 - <<'PY'
import json,urllib.request
def api(p): return json.load(urllib.request.urlopen("http://localhost:3000/api"+p))["data"]
def patch(p,body):
    r=urllib.request.Request("http://localhost:3000/api"+p,data=json.dumps(body).encode(),headers={"Content-Type":"application/json"},method="PATCH")
    urllib.request.urlopen(r).read()
tasks=api("/tasks")
for i,t in enumerate(tasks):
    if i%3!=2: patch(f"/tasks/{t['id']}/status",{"status":"EXECUTADA"})
goals=api("/goals")
if goals: patch(f"/goals/{goals[0]['id']}/status",{"status":"CUMPRIDA"})
if len(goals)>3: patch(f"/goals/{goals[3]['id']}/status",{"status":"CUMPRIDA"})
print("dados de exemplo criados")
PY
