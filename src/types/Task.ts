export type TaskType = 'daily' | 'weekly' | 'custom';

export type TaskInputType = 'check' | 'count';

export interface TaskDefinition {
  id: string;
  name: string;
  type: TaskType;
  inputType: TaskInputType;
  // New properties for custom tasks (only for type 'custom')
  resetDays?: number[]; // Array of numbers (0-6, Sun-Sat) for days when the custom task resets
  resetTime?: string; // Time in "HH:mm" format when the custom task resets
  imageUrl?: string; // Optional: URL or path to an image representing the task
  displayFirstLetterOnImage?: boolean; // Optional: Whether to display the first letter of the name on the image
}

export interface CharacterTaskCompletion {
  id: string; // Unique ID for this completion entry
  characterId: string;
  taskDefinitionId: string;
  completed: boolean;
  currentCount: number;
  lastResetDate: string; // ISO date string for when this specific character's task was last reset
}
