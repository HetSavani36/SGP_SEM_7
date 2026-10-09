// Mentor approval gate. This used to (mis)use jobStateMachine.
export const APPROVAL_TRANSITIONS = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export function canApprovalTransition(current, next) {
  return APPROVAL_TRANSITIONS[current]?.includes(next) ?? false;
}
