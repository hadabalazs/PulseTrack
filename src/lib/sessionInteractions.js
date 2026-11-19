export function hasEnteredDistance(log, draft) {
  const value = draft === undefined ? log?.distance : draft;
  return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
}

export function sessionTapIntent(log, draft) {
  return !log ? 'add' : hasEnteredDistance(log, draft) ? 'confirm' : 'remove';
}

export const SESSION_HOLD_MS = 500;
export const SESSION_MOVE_PX = 8;
