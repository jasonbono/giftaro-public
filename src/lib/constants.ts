export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://giftaro.app";

export const STRIPE_FIXED_FEE_CENTS = 30;
export const STRIPE_PERCENT_RETAINED = 0.94; // combined processor + platform fee (representative placeholder; production value redacted)

export const CONTRIBUTION_MIN_CENTS = 100;
export const CONTRIBUTION_MAX_CENTS = 1_000_000;

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const EMAIL_FROM = "Giftaro <hello@mail.giftaro.app>";
export const EMAIL_FOOTER = "Giftaro — One great gift.";


export const COPY_FEEDBACK_MS = 2000;
