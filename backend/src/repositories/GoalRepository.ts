import { FileRepository } from "../persistence/FileRepository";
import { Goal } from "../types/entities";

export class GoalRepository extends FileRepository<Goal> {
  constructor() {
    super("goals.json");
  }
}
