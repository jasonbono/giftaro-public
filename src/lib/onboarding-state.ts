export type OnboardingState = "none" | "incomplete" | "under_review" | "complete";

export function getOnboardingState(user: {
  stripeAccountId?: string | null;
  detailsSubmitted?: number | null;
  chargesEnabled?: number | null;
}): OnboardingState {
  if (user.chargesEnabled) return "complete";
  if (!user.stripeAccountId) return "none";
  if (user.detailsSubmitted) return "under_review";
  return "incomplete";
}
