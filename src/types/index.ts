
export type Habit = {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
  archived: boolean;
  progress: Record<string, boolean>; // Key: YYYY-MM-DD, Value: completed
  color?: string; // Optional color for the habit card/visuals
};

export type ProgressDataPoint = {
  date: string; // YYYY-MM-DD
  completed: number; // Number of habits completed
  total: number; // Total habits for that day
  rate: number; // Completion rate (0-1)
};

export type HabitCompletionStat = {
  name: string; // Habit name
  value: number; // Completion count or percentage
};
