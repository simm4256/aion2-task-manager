import type { ResourceDefinition } from '../types/Resource.ts';
import type { TaskDefinition } from '../types/Task.ts';

// Helper function to check if two dates are the same day (ignoring time)
export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Helper function to check if two dates are in the same week (assuming week starts on Monday)
export const isSameWeek = (d1: Date, d2: Date) => {
  const getMonday = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (0) to Monday (1)
    return new Date(date.setDate(diff));
  };

  const monday1 = getMonday(new Date(d1));
  const monday2 = getMonday(new Date(d2));

  return isSameDay(monday1, monday2);
};

// New helper function to get the next upcoming reset time for custom tasks
export const getNextCustomResetTime = (
  currentTime: Date,
  resetDays: number[] | undefined, // Array of numbers (0-6, Sun-Sat)
  resetTime: string | undefined // "HH:mm" format
): Date | null => {
  if (!resetDays || resetDays.length === 0 || !resetTime) {
    return null; // No reset days or time configured
  }

  const now = new Date(currentTime);
  const [resetHour, resetMinute] = resetTime.split(':').map(Number);
  let nextResetCandidate: Date | null = null;

  // Iterate through reset days to find the next upcoming reset
  for (let i = 0; i < 7; i++) { // Check up to 7 days in the future
    const candidateDate = new Date(now);
    candidateDate.setDate(now.getDate() + i); // Start from today and go forward

    const candidateDayOfWeek = candidateDate.getDay();

    if (resetDays.includes(candidateDayOfWeek)) {
      const potentialResetTime = new Date(candidateDate);
      potentialResetTime.setHours(resetHour, resetMinute, 0, 0);

      // If this potential reset time is in the future, it's a candidate
      if (potentialResetTime.getTime() > now.getTime()) {
        if (nextResetCandidate === null || potentialResetTime.getTime() < nextResetCandidate.getTime()) {
          nextResetCandidate = potentialResetTime;
        }
      }
    }
  }

  // If no future reset in the next 7 days (e.g., all resets passed for this week),
  // check for next week's earliest reset day.
  if (nextResetCandidate === null) {
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7); // Go to next week
      nextWeek.setHours(resetHour, resetMinute, 0, 0); // Set to reset time

      // Find the earliest reset day in the resetDays array (e.g. Monday if [1, 3, 5])
      const earliestResetDay = resetDays.sort((a,b) => a-b)[0];
      const daysUntilEarliestReset = (earliestResetDay - nextWeek.getDay() + 7) % 7;
      
      nextWeek.setDate(nextWeek.getDate() + daysUntilEarliestReset);
      nextResetCandidate = nextWeek;
  }
  

  return nextResetCandidate;
};


// Helper function to calculate time remaining until next reset
export const getTimeRemainingUntilReset = (
  taskDef: TaskDefinition,
  currentTime: Date,
  dailyResetHour: number,
  dailyResetMinute: number,
  dailyResetSecond: number,
  weeklyResetDay: number,
  weeklyResetHour: number,
  weeklyResetMinute: number,
  weeklyResetSecond: number
): string => {
  const now = new Date(currentTime);
  let nextResetTime: Date | null = null;

  if (taskDef.type === 'daily') {
    const currentDailyResetPoint = getMostRecentDailyResetPoint(now, dailyResetHour, dailyResetMinute, dailyResetSecond);
    nextResetTime = new Date(currentDailyResetPoint);
    // If current time is *after* or *at* the daily reset point, the next reset is tomorrow.
    if (now.getTime() >= nextResetTime.getTime()) {
      nextResetTime.setDate(nextResetTime.getDate() + 1);
    }
  } else if (taskDef.type === 'weekly') {
    // Let's use getResetCheckPoint to find the next reset.
    // getResetCheckPoint finds the most recent past or current point.
    let nextWeeklyResetPointCandidate = getResetCheckPoint(now, weeklyResetDay, weeklyResetHour, weeklyResetMinute, weeklyResetSecond);

    // If this candidate is in the past, the next reset is one cycle (7 days) later.
    if (now.getTime() >= nextWeeklyResetPointCandidate.getTime()) {
      nextWeeklyResetPointCandidate.setDate(nextWeeklyResetPointCandidate.getDate() + 7);
    }
    nextResetTime = nextWeeklyResetPointCandidate;

  } else if (taskDef.type === 'custom') {
    nextResetTime = getNextCustomResetTime(currentTime, taskDef.resetDays, taskDef.resetTime);
  }

  if (!nextResetTime) {
      return "설정되지 않음"; // Or a default message
  }

  const diff = nextResetTime.getTime() - now.getTime(); // Difference in milliseconds

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let result = '';
  if (days > 0) {
    result += `${days}일 `;
  }
  if (hours > 0 || days > 0) { // Show hours if there are days, or if hours is > 0
    result += `${hours}시간 `;
  }
  result += `${minutes}분`;

  return result.trim();
};

// Helper to get the most recent past or current configured reset point
export const getResetCheckPoint = (date: Date, resetDay: number, resetHour: number, resetMinute: number, resetSecond: number): Date => {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

  // Calculate days since the configured resetDay
  // (dayOfWeek - resetDay + 7) % 7 gives 0 if today is resetDay
  const daysSinceConfiguredDay = (dayOfWeek - resetDay + 7) % 7;
  d.setDate(d.getDate() - daysSinceConfiguredDay);
  d.setHours(resetHour, resetMinute, resetSecond, 0); // Use configurable hour, minute, second
      return d;
  };
  
  // New helper function to get the next upcoming weekly reset time
  export const getNextWeeklyResetTime = (
      currentTime: Date,
      resetDay: number, // 0-6, Sun-Sat
      resetHour: number,
      resetMinute: number,
      resetSecond: number
  ): Date => {
      let nextResetCandidate = getResetCheckPoint(currentTime, resetDay, resetHour, resetMinute, resetSecond);
      // If the calculated checkpoint is in the past relative to currentTime,
      // then the next reset is 7 days from this checkpoint.
      if (currentTime.getTime() > nextResetCandidate.getTime()) {
          nextResetCandidate.setDate(nextResetCandidate.getDate() + 7);
      }
              return nextResetCandidate;
          };
          
          // New helper function to get the most recent past or current configured weekly reset point
          export const getMostRecentWeeklyResetPoint = (
            checkTime: Date, // The time to check against (either `now` or `lastReset`)
            resetDay: number, // 0-6, Sun-Sat
            resetHour: number,
            resetMinute: number,
            resetSecond: number
          ): Date => {
          
          
            // Create a date object for the *current week's* reset point
            const currentWeekReset = new Date(checkTime);
            const dayOfWeek = currentWeekReset.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
          
            // Calculate days to adjust to get to the *this week's* reset day
            // (dayOfWeek - resetDay + 7) % 7 gives 0 if today is resetDay
            const daysToCurrentWeekResetDay = (dayOfWeek - resetDay + 7) % 7;
            currentWeekReset.setDate(currentWeekReset.getDate() - daysToCurrentWeekResetDay);
            currentWeekReset.setHours(resetHour, resetMinute, resetSecond, 0);
          
            // If checkTime is BEFORE this week's calculated reset point,
            // then the most recent reset actually occurred last week.
            if (checkTime.getTime() < currentWeekReset.getTime()) {
              currentWeekReset.setDate(currentWeekReset.getDate() - 7); // Go back one week
            }
          
            return currentWeekReset;
          };
          // Helper to get the most recent past or current configured daily reset point (hour, minute, second)
          export const getMostRecentDailyResetPoint = (
  checkTime: Date, // The time to check against (either `now` or `lastReset`)
  resetHour: number, resetMinute: number, resetSecond: number
): Date => {
  const d = new Date(checkTime); // Copy the date
  d.setHours(resetHour, resetMinute, resetSecond, 0); // Set to the reset time

  // If the checkTime is BEFORE this reset time, then the most recent reset point was on the previous day.
  // Otherwise, the most recent reset point is today at the configured time.
  if (checkTime.getTime() < d.getTime()) {
    d.setDate(d.getDate() - 1); // Go back to yesterday
  }
  return d;
};


// New helper function to calculate time remaining until next resource charge
export const getTimeRemainingUntilResourceCharge = (
  resourceDef: ResourceDefinition,
  currentTime: Date
): string => {
  const now = new Date(currentTime);
  const { chargeStartTimeHour, chargeStartTimeMinute, chargeStartTimeSecond, chargeCycleHours } = resourceDef;

  let nextChargeTime = new Date(now);
  nextChargeTime.setHours(chargeStartTimeHour, chargeStartTimeMinute, chargeStartTimeSecond, 0);

  // If the calculated nextChargeTime is in the past relative to now,
  // we need to advance it by full charge cycles until it's in the future.
  while (nextChargeTime.getTime() <= now.getTime()) {
    nextChargeTime.setHours(nextChargeTime.getHours() + chargeCycleHours);
  }
  
  const diff = nextChargeTime.getTime() - now.getTime(); // Difference in milliseconds

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let result = '';
  if (hours > 0) {
    result += `${hours}시간 `;
  }
  if (minutes > 0 || hours > 0) { // Show minutes if there are hours, or if minutes > 0
    result += `${minutes}분 `;
  }
  result += `${seconds}초 뒤 +${resourceDef.amountPerCharge}`;

  return result.trim();
};
