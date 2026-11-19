export const DEFAULT_SPORTS = Object.freeze([
  "Running", "Swimming", "Cycling", "Weight Training", "Yoga", "HIIT", "Walking", "Pilates", "Football",
]);
export const SPORT_NAME_LIMIT = 50;

function cleanName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/** Clean saved values without changing the spelling of existing sport names. */
export function normalizeCustomSports(values) {
  const seen = new Set(DEFAULT_SPORTS.map(name => name.toLowerCase()));
  return (Array.isArray(values) ? values : []).reduce((sports, value) => {
    const name = cleanName(value), key = name.toLowerCase();
    if (name && name.length <= SPORT_NAME_LIMIT && !seen.has(key)) {
      seen.add(key);
      sports.push(name);
    }
    return sports;
  }, []);
}

export function addSportName(customSports, value) {
  const name = cleanName(value);
  const sports = normalizeCustomSports(customSports);
  if (!name) return { error: "Enter a sport name." };
  if (name.length > SPORT_NAME_LIMIT) return { error: `Use ${SPORT_NAME_LIMIT} characters or fewer.` };
  if ([...DEFAULT_SPORTS, ...sports].some(sport => sport.toLowerCase() === name.toLowerCase())) {
    return { error: "This sport is already in the list." };
  }
  return { name, sports: [...sports, name] };
}
