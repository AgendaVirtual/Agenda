#!/usr/bin/env bash
# Teste manual do módulo de Metas (Backend Pessoa 1).
# Requer o servidor rodando em localhost:3000 (npm run dev).
#
# Uso: bash scripts/test-goals.sh

set -e
BASE="http://localhost:3000/api"

echo "== 1. Pegando uma categoria válida =="
CATEGORY_ID=$(curl -s "$BASE/categories" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
echo "categoryId: $CATEGORY_ID"

echo ""
echo "== 2. Criando meta SEMANAL válida (7 dias) =="
GOAL=$(curl -s -X POST "$BASE/goals" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Meta semanal teste\",\"categoryId\":\"$CATEGORY_ID\",\"period\":\"SEMANAL\",\"startDate\":\"2026-08-24\",\"endDate\":\"2026-08-30\"}")
echo "$GOAL"
GOAL_ID=$(echo "$GOAL" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')

echo ""
echo "== 3. Validação: meta SEMANAL com duração de 3 meses (deve dar erro) =="
curl -s -X POST "$BASE/goals" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Falha esperada\",\"categoryId\":\"$CATEGORY_ID\",\"period\":\"SEMANAL\",\"startDate\":\"2026-08-01\",\"endDate\":\"2026-10-30\"}"
echo ""

echo ""
echo "== 4. Validação: data de início depois da data de fim (deve dar erro) =="
curl -s -X POST "$BASE/goals" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Falha esperada\",\"categoryId\":\"$CATEGORY_ID\",\"period\":\"MENSAL\",\"startDate\":\"2026-09-01\",\"endDate\":\"2026-08-01\"}"
echo ""

echo ""
echo "== 5. Criando meta MENSAL válida (~1 mês) =="
curl -s -X POST "$BASE/goals" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Meta mensal teste\",\"categoryId\":\"$CATEGORY_ID\",\"period\":\"MENSAL\",\"startDate\":\"2026-08-01\",\"endDate\":\"2026-08-31\"}"
echo ""

echo ""
echo "== 6. Criando meta ANUAL válida (~1 ano) =="
curl -s -X POST "$BASE/goals" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Meta anual teste\",\"categoryId\":\"$CATEGORY_ID\",\"period\":\"ANUAL\",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\"}"
echo ""

echo ""
echo "== 7. Listando todas as metas =="
curl -s "$BASE/goals"
echo ""

echo ""
echo "== 8. Listando metas filtradas por período (SEMANAL) =="
curl -s "$BASE/goals?period=SEMANAL"
echo ""

echo ""
echo "== 9. Status: CUMPRIDA =="
curl -s -X PATCH "$BASE/goals/$GOAL_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"CUMPRIDA"}'
echo ""

echo ""
echo "== 10. Status: PARCIALMENTE_CUMPRIDA =="
curl -s -X PATCH "$BASE/goals/$GOAL_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"PARCIALMENTE_CUMPRIDA"}'
echo ""

echo ""
echo "== 11. Status: NAO_CUMPRIDA =="
curl -s -X PATCH "$BASE/goals/$GOAL_ID/status" \
  -H "Content-Type: application/json" -d '{"status":"NAO_CUMPRIDA"}'
echo ""

echo ""
echo "Teste finalizado!"