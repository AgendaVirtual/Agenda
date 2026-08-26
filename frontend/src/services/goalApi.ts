import { request } from "./api";
import type { CreateGoalDTO, Goal } from "../types/entities";
import type { GoalPeriod, GoalStatus } from "../types/enums";

export function getGoals(period?: GoalPeriod | ""): Promise<Goal[]> {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return request<Goal[]>(`/goals${query}`);
}

export function createGoal(data: CreateGoalDTO): Promise<Goal> {
  return request<Goal>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGoalStatus(
  id: string,
  status: GoalStatus,
): Promise<Goal> {
  return request<Goal>(`/goals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export const GOAL_EDIT_SUPPORTED = false;
