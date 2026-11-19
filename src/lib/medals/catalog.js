export const FAMILY_LABELS = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Lifetime', special: 'Special' };
const definitions = [];
function add(id, title, family, rule, recipe, value = null, extra = {}) {
  definitions.push({ id, title, family, rule, recipe, value, version: 1, priority: definitions.length, ...extra });
}
add('week-3', 'Find Your Rhythm', 'weekly', '3 active days in a Monday–Sunday week.', 'pulse', 3);
add('week-5', 'Strong Week', 'weekly', '5 active days in a Monday–Sunday week.', 'pulse', 5);
add('week-explore', 'Mix It Up', 'weekly', '3 different sports in one Monday–Sunday week.', 'prism', 3);
add('month-12', 'Monthly Momentum', 'monthly', '12 active days in a calendar month.', 'orbit', 12);
add('month-20', 'Month in Motion', 'monthly', '20 active days in a calendar month.', 'orbit', 20);
add('month-explore', 'Explore More', 'monthly', '4 different sports in a calendar month.', 'prism', 4);
add('year-100', 'Century Year', 'yearly', '100 active days in a calendar year.', 'sun', 100);
add('year-200', 'Year in Motion', 'yearly', '200 active days in a calendar year.', 'sun', 200);
add('year-months', 'All Seasons', 'yearly', 'At least one workout in every month of a calendar year.', 'sun', 12);
for (const value of [1, 10, 25, 50, 100, 250, 500, 1000]) {
  add(`active-${value}`, value === 1 ? 'First Step' : value >= 250 ? 'The Long Game' : 'Building Momentum', 'lifetime', value === 1 ? 'Your first recorded workout.' : `${value.toLocaleString()} lifetime active days.`, value >= 250 ? 'infinity' : 'pulse', value);
}
for (const value of [3, 5, 8]) add(`explore-${value}`, 'Sport Explorer', 'lifetime', `Try ${value} different sports.`, 'prism', value);
export const DISTANCE_TIERS = { Running: [25, 100, 500, 1000], Walking: [25, 100, 500, 1000], Cycling: [100, 500, 1000, 5000], Swimming: [5, 25, 100, 250] };
for (const value of [...new Set(Object.values(DISTANCE_TIERS).flat())].sort((a, b) => a - b)) add(`distance-${value}`, 'Going the Distance', 'lifetime', `${value.toLocaleString()} cumulative kilometres in this sport.`, 'distance', value);
add('fresh-start', 'Fresh Start', 'special', 'Log a workout on January 1.', 'sunrise');
add('earth-day', 'Earth Day', 'special', 'Log a workout on April 22.', 'leaf');
add('first-year', 'Your First Year', 'special', 'Log a workout in the seven days starting on your first workout anniversary.', 'anniversary', 1);
add('return', 'Back in Motion', 'special', 'Return after at least 14 complete days without a workout.', 'return');

export const METAL_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };
const metals = Object.keys(METAL_LABELS);
const difficulty = {
  'week-3': 'bronze', 'week-5': 'silver', 'week-explore': 'silver',
  'month-12': 'silver', 'month-20': 'gold', 'month-explore': 'silver',
  'year-100': 'gold', 'year-200': 'platinum', 'year-months': 'gold',
  'active-25': 'silver', 'active-50': 'silver', 'active-100': 'gold',
  'active-250': 'gold', 'active-500': 'platinum', 'active-1000': 'platinum',
  'explore-5': 'silver', 'explore-8': 'gold', 'first-year': 'silver',
};
export const MEDAL_CATALOG = Object.freeze(definitions.map(definition => Object.freeze({ ...definition, metal: difficulty[definition.id] || 'bronze' })));
// Distance difficulty follows each sport's own progression, not raw kilometres.
export function medalAppearance(definition, scope) {
  const tiers = DISTANCE_TIERS[scope?.slice(6)];
  const index = definition.recipe === 'distance' ? tiers?.indexOf(definition.value) : -1;
  return index >= 0 ? { ...definition, metal: metals[index] } : definition;
}
export const MEDAL_RENDER_VARIANTS = [...new Map(MEDAL_CATALOG.flatMap(definition => definition.recipe === 'distance'
  ? Object.keys(DISTANCE_TIERS).filter(sport => DISTANCE_TIERS[sport].includes(definition.value)).map(sport => medalAppearance(definition, `sport:${sport}`))
  : [definition]).map(definition => [`${definition.id}-${definition.metal}`, definition])).values()];
export const MEDAL_BY_ID = new Map(MEDAL_CATALOG.map(definition => [definition.id, definition]));
export const scopeForSport = sport => `sport:${sport}`;
export const scopeLabel = scope => scope === 'all' ? 'All sports together' : scope.slice(6);
export const medalTitle = definition => `${definition.title}${definition.value && definition.value !== 1 && definition.family === 'lifetime' ? ` · ${definition.value.toLocaleString()}${definition.recipe === 'distance' ? ' km' : definition.recipe === 'prism' ? ' sports' : ' days'}` : ''}`;
export const posterPath = definition => `/medals/${definition.id}-${definition.metal}.webp`;
