// Company-side pipeline (mentor approval is a separate gate, see approvalStateMachine.js)
//
// pending -> shortlisted -> [aptitude] -> interview -> hired
//     \___________\______________\___________\______-> rejected
export const STUDENT_APPLICATION_TRANSITIONS = {
  pending: ["shortlisted", "rejected"],
  shortlisted: ["aptitude", "interview", "rejected"],
  aptitude: ["interview", "rejected"],
  interview: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

export function canStudentApplicationTransition(current, next) {
  return STUDENT_APPLICATION_TRANSITIONS[current]?.includes(next) ?? false;
}
