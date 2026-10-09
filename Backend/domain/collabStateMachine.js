// A rejected collaboration can be re-requested (by either side) -> pending again.
export const COLLAB_TRANSITIONS = {
  pending: ["accepted", "rejected"],
  accepted: [],
  rejected: ["pending"],
};

export function canCollabTransition(current, next) {
  return COLLAB_TRANSITIONS[current]?.includes(next) ?? false;
}
