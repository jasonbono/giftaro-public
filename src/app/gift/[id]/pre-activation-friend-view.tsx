import { ButtonLink } from "@/components/ui";
import { NudgeOrganizerButton } from "./nudge-organizer";

export function PreActivationFriendView({
  giftId,
  organizerName,
  giftTitle,
  isLoggedIn,
}: {
  giftId: string;
  organizerName: string;
  giftTitle: string;
  isLoggedIn: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 text-center ring-1 ring-amber-200/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-rose-950/40 dark:ring-amber-900/40">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Almost there!
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {organizerName} is still setting this up. Give them a nudge so you can chip in.
        </p>
        <div className="mt-5">
          <NudgeOrganizerButton
            giftId={giftId}
            organizerName={organizerName}
            giftTitle={giftTitle}
          />
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200/70 p-5 text-center dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Your turn for one great gift.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Start one in 60 seconds. Share the link. Make their year.
        </p>
        <ButtonLink
          href={isLoggedIn ? "/dashboard/gifts/new" : "/?mode=signup&returnTo=/dashboard/gifts/new"}
          variant="secondary"
          className="mt-4"
        >
          Create your own gift
        </ButtonLink>
      </div>
    </div>
  );
}
