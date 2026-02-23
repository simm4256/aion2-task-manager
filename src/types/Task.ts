export type TaskType = 'daily' | 'weekly' | 'custom'; // Add 'custom'

export interface TaskDefinition {
  id: string;
  name: string;
  type: TaskType;
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
  lastResetDate: string; // ISO date string for when this specific character's task was last reset
}
