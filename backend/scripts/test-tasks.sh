#!/usr/bin/env bash
# Teste manual do módulo de Tarefas (Backend Pessoa 2).
# Requer o servidor rodando em localhost:3000 (npm run dev).
#
# Uso: bash scripts/test-tasks.sh

set -e
BASE="http://localhost:3000/api"

echo "== 1. Pegando uma categoria válida =="
CATEGORY_ID=$(curl -s "$BASE/categories" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
echo "categoryId: $CATEGORY_ID"

echo ""
echo "== 2. Criando tarefa (bloco UMA_HORA) =="
TASK=$(curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Tarefa teste\",\"categoryId\":\"$CATEGORY_ID\",\"date\":\"2026-08-25\",\"timeBlockType\":\"UMA_HORA\",\"time\":\"09:00\",\"priority\":\"ALTA\"}")
echo "$TASK"
TASK_ID=$(echo "$TASK" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')

echo ""
echo "== 3. Testando validação: categoria inexistente (deve dar erro) =="
curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d '{"description":"Falha esperada","categoryId":"nao-existe","date":"2026-08-25","timeBlockType":"UMA_HORA","time":"10:00","priority":"BAIXA"}'
echo ""

echo ""
echo "== 4. Testando validação: bloco UMA_HORA sem time (deve dar erro) =="
curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Falha esperada\",\"categoryId\":\"$CATEGORY_ID\",\"date\":\"2026-08-25\",\"timeBlockType\":\"UMA_HORA\",\"priority\":\"BAIXA\"}"
echo ""

echo ""
echo "== 5. Testando validação: horário sobreposto (deve dar erro) =="
curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Conflito\",\"categoryId\":\"$CATEGORY_ID\",\"date\":\"2026-08-25\",\"timeBlockType\":\"UMA_HORA\",\"time\":\"09:00\",\"priority\":\"BAIXA\"}"
echo ""

echo ""
echo "== 6. Status: EXECUTADA =="
curl -s -X PATCH "$BASE/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"EXECUTADA"}'
echo ""

echo ""
echo "== 7. Status: PARCIALMENTE_EXECUTADA =="
curl -s -X PATCH "$BASE/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"PARCIALMENTE_EXECUTADA"}'
echo ""

echo ""
echo "== 8. Status: ADIADA =="
curl -s -X PATCH "$BASE/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"ADIADA"}'
echo ""

echo ""
echo "== 9. Status: CANCELADA =="
curl -s -X PATCH "$BASE/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"CANCELADA"}'
echo ""

echo ""
echo "== 10. Listando tarefas do dia =="
curl -s "$BASE/tasks?date=2026-08-25"
echo ""

echo ""
echo "== 11. Removendo a tarefa de teste =="
curl -s -X DELETE "$BASE/tasks/$TASK_ID"
echo ""

echo ""
echo "Teste finalizado."