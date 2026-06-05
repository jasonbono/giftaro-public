import { Resend } from "resend";
import { EMAIL_FROM, EMAIL_FOOTER } from "./constants";
import { calcProgress } from "./progress";

let client: Resend | null = null;

function resend(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY!);
  }
  return client;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(name: string | null, fallback = "there"): string {
  const trimmed = name?.trim();
  return trimmed ? escapeHtml(trimmed.split(" ")[0]) : fallback;
}

function progressBarHtml(totalCents: number, targetCents: number, title: string, showPercent = true): string {
  const total = (totalCents / 100).toFixed(2);
  const target = (targetCents / 100).toFixed(2);
  const progress = calcProgress(totalCents, targetCents);
  const percentSuffix = showPercent ? ` (${progress}%)` : "";
  return `<div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">${title}</p>
          <div style="background:#e5e7eb;border-radius:999px;height:8px;overflow:hidden;">
            <div style="background:#16a34a;height:100%;width:${progress}%;border-radius:999px;"></div>
          </div>
          <p style="margin:8px 0 0;font-size:14px;color:#374151;font-weight:500;">$${total} raised of $${target}${percentSuffix}</p>
        </div>`;
}

function signUpCtaHtml(
  baseUrl: string,
  heading = "Got a gift in mind?",
  body = "Create your own gift in 60 seconds — no app needed."
): string {
  return `<div style="margin:24px 0 0;padding:16px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:500;">${heading}</p>
          <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${body}</p>
          <a href="${baseUrl}/?mode=signup&amp;returnTo=/dashboard/gifts/new" style="display:inline-block;padding:8px 16px;background:#f3f4f6;color:#111827;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">Create your own gift</a>
        </div>`;
}

function elevatedReceiptCtaHtml(baseUrl: string, organizerFirstName: string): string {
  return `<div style="margin:24px 0 0;padding:16px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 10px;font-size:16px;color:#111827;font-weight:600;">${organizerFirstName} just elevated their life with Giftaro.</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;">Signs you should too:</p>
          <ul style="margin:0 0 14px;padding:0 0 0 18px;font-size:14px;color:#374151;line-height:1.6;">
            <li>A house of gifts you feel too guilty to part with.</li>
            <li>A forced wishlist because the real thing feels too much to ask.</li>
            <li>Ten small gifts that could&rsquo;ve been one thing you&rsquo;d actually love.</li>
          </ul>
          <a href="${baseUrl}/?mode=signup&amp;returnTo=/dashboard/gifts/new" style="display:inline-block;padding:8px 16px;background:#f3f4f6;color:#111827;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500;">Create your own gift</a>
        </div>`;
}

export async function sendContributionEmail(params: {
  organizerEmail: string;
  organizerName: string;
  giftTitle: string;
  contributorName: string | null;
  amountCents: number;
  contributorNote: string | null;
  totalContributedCents: number;
  targetAmountCents: number;
  giftUrl: string;
}) {
  const amount = (params.amountCents / 100).toFixed(2);
  const contributor = params.contributorName || "Someone";
  const safeContributor = escapeHtml(contributor);
  const safeNote = params.contributorNote ? escapeHtml(params.contributorNote) : null;
  const noteHtml = safeNote
    ? `<p style="margin:16px 0;padding:12px 16px;background:#f9fafb;border-left:3px solid #e5e7eb;border-radius:4px;color:#374151;font-style:italic;">"${safeNote}"</p>`
    : "";
  const safeTitle = escapeHtml(params.giftTitle);

  await resend().emails.send({
    from: EMAIL_FROM,
    to: params.organizerEmail,
    subject: `${contributor} chipped in $${amount} for ${params.giftTitle}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hey ${firstName(params.organizerName)},</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">${safeContributor} just chipped in $${amount} to the pool.</p>
        ${noteHtml}
        ${progressBarHtml(params.totalContributedCents, params.targetAmountCents, safeTitle)}
        <a href="${params.giftUrl}" style="display:inline-block;margin:8px 0 0;padding:10px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View gift</a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${EMAIL_FOOTER}</p>
      </div>
    `,
  });
}

export async function sendContributorReceiptEmail(params: {
  contributorEmail: string;
  contributorName: string | null;
  organizerName: string | null;
  giftTitle: string;
  amountCents: number;
  totalContributedCents: number;
  targetAmountCents: number;
  giftUrl: string;
}) {
  const amount = (params.amountCents / 100).toFixed(2);
  const safeTitle = escapeHtml(params.giftTitle);
  const baseUrl = params.giftUrl.split("/gift/")[0];
  const organizerFirst = firstName(params.organizerName, "They");

  await resend().emails.send({
    from: EMAIL_FROM,
    to: params.contributorEmail,
    subject: `Cheers — you chipped in $${amount} for ${params.giftTitle}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hey ${firstName(params.contributorName)},</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">Cheers! You chipped in $${amount} to the pool.</p>
        ${progressBarHtml(params.totalContributedCents, params.targetAmountCents, safeTitle, false)}
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Know a friend who&#39;d want in on the pool? Send them the link:</p>
        <a href="${params.giftUrl}" style="display:inline-block;margin:0 0 24px;padding:10px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Send the link</a>
        ${elevatedReceiptCtaHtml(baseUrl, organizerFirst)}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${EMAIL_FOOTER}</p>
      </div>
    `,
  });
}

export async function sendSubscribeConfirmationEmail(params: {
  email: string;
  baseUrl: string;
}) {
  await resend().emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: `You're set — we'll remind you`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">You're set.</p>
        <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">We'll email you when it's time to start the gift — a few weeks before the occasion, so there's enough runway. No spam in between.</p>
        <p style="margin:0 0 12px;font-size:14px;color:#374151;">Already got a gift in mind?</p>
        <a href="${params.baseUrl}/?mode=signup&amp;returnTo=/dashboard/gifts/new" style="display:inline-block;padding:10px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Create your gift</a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${EMAIL_FOOTER}</p>
      </div>
    `,
  });
}

export async function sendFullyFundedEmail(params: {
  contributorEmail: string;
  contributorName: string | null;
  giftTitle: string;
  giftUrl: string;
}) {
  const safeTitle = escapeHtml(params.giftTitle);
  const baseUrl = params.giftUrl.split("/gift/")[0];

  await resend().emails.send({
    from: EMAIL_FROM,
    to: params.contributorEmail,
    subject: `The pool's full for ${params.giftTitle} 🎉`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hey ${firstName(params.contributorName)},</p>
        <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">The pool's full! 🎉</p>
        <p style="margin:0 0 20px;font-size:14px;color:#374151;">${safeTitle} hit its goal — you made it happen. Someone's about to have the best day.</p>
        <a href="${params.giftUrl}" style="display:inline-block;margin:0 0 24px;padding:10px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">See the gift</a>
        ${signUpCtaHtml(baseUrl, "Your turn?", "Create your own gift in 60 seconds. Let friends chip into the pool for any gift.")}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${EMAIL_FOOTER}</p>
      </div>
    `,
  });
}
