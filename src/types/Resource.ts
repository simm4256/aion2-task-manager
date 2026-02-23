export interface ResourceDefinition {
  id: string;
  name: string;
  chargeStartTimeHour: number;   // Hour (0-23) when charge starts
  chargeStartTimeMinute: number; // Minute (0-59) when charge starts
  chargeStartTimeSecond: number; // Second (0-59) when charge starts
  chargeCycleHours: number; // How often (in hours) it charges
  amountPerCharge: number; // New: How much resource is added per charge cycle
  maxAmount: number; // Max amount a resource can hold (e.g., 5 for tokens, 1 for daily quest)
  displayOnCharacter: boolean; // New: Whether this resource should be displayed under the character name
  imageUrl?: string; // Optional: URL or path to an image representing the resource
  displayFirstLetterOnImage?: boolean; // Optional: Whether to display the first letter of the name on the image
}

export interface CharacterResourceState {
  id: string; // Unique ID for this resource state entry
  characterId: string;
  resourceDefinitionId: string;
  currentAmount: number;
  lastUpdateTime: string; // ISO string of last time resource was updated (e.g., user clicked, or auto-charged)
}