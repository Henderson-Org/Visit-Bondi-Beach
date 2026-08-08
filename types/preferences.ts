/** User questionnaire model for the Bondi Day Planner. */

export type Interest =
  | 'swimming'
  | 'beach'
  | 'coastal-walks'
  | 'food'
  | 'coffee'
  | 'markets'
  | 'shopping'
  | 'photography'
  | 'relaxing'
  | 'fitness'
  | 'iconic'
  | 'family'
  | 'nightlife';

export type FoodStyle =
  | 'coffee'
  | 'brunch'
  | 'casual'
  | 'healthy'
  | 'seafood'
  | 'japanese'
  | 'modern-au'
  | 'special-occasion'
  | 'fine-dining'
  | 'cocktails'
  | 'sunset-drinks'
  | 'dessert'
  | 'no-pref';

export type StartTime = 'sunrise' | 'morning' | 'midday' | 'afternoon' | 'evening';
export type Duration = '2h' | 'half' | 'full';
export type Walking = 'low' | 'medium' | 'high';
export type Pace = 'relaxed' | 'balanced' | 'max';
export type Budget = 1 | 2 | 3 | 4;

export interface Preferences {
  /** ISO date (YYYY-MM-DD) of the visit — drives market/opening-day logic. */
  date: string;
  startTime: StartTime;
  duration: Duration;
  interests: Interest[];
  foodStyles: FoodStyle[];
  budget: Budget;
  walking: Walking;
  pace: Pace;
}

export type MealSlot = 'coffee' | 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'drinks' | 'dessert';

/** True when the visitor genuinely cares about food (drives restaurant-first generation). */
export function foodIsPriority(p: Preferences): boolean {
  const styled = p.foodStyles.filter((f) => f !== 'no-pref').length > 0;
  return p.interests.includes('food') || styled;
}
