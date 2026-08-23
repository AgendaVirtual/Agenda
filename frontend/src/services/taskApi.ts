import { request } from "./api";
import type { CreateTaskDTO, Task } from "../types/entities";
import type { TaskStatus } from "../types/enums";

export function getTasksByDate(date: string): Promise<Task[]> {
  return request<Task[]>(`/tasks?date=${encodeURIComponent(date)}`);
}

export function createTask(data: CreateTaskDTO): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(
  id: string,
  data: CreateTaskDTO
): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<Task> {
  return request<Task>(`/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: "DELETE" });
}
