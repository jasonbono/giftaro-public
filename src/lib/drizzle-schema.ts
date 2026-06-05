import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  stripeAccountId: text("stripe_account_id").unique(),
  onboardingStatus: text("onboarding_status").default("pending"),
  chargesEnabled: integer("charges_enabled").default(0),
  payoutsEnabled: integer("payouts_enabled").default(0),
  detailsSubmitted: integer("details_submitted").default(0),
  stripeStatusSyncedAt: text("stripe_status_synced_at"),
  testMode: integer("test_mode", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: text("access_token_expires_at"),
  refreshTokenExpiresAt: text("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const gifts = sqliteTable("gifts", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  targetAmountCents: integer("target_amount_cents").notNull(),
  organizerName: text("organizer_name"),
  currency: text("currency").default("usd"),
  totalContributedCents: integer("total_contributed_cents").default(0),
  status: text("status").default("open"),
  eventDate: text("event_date"),
  productUrl: text("product_url"),
  ogImage: text("og_image"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  trashedAt: text("trashed_at"),
  imageZoom: real("image_zoom").default(1),
  imageOffsetX: real("image_offset_x").default(0),
  imageOffsetY: real("image_offset_y").default(0),
  expectedContributors: integer("expected_contributors"),
  fullyFundedNotified: integer("fully_funded_notified").default(0),
  fullyFundedAt: text("fully_funded_at"),
  aiImagesGenerated: integer("ai_images_generated").default(0),
  imageGallery: text("image_gallery"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ([
  index("idx_gifts_user_id").on(table.userId),
  index("idx_gifts_status").on(table.status),
  index("idx_gifts_trashed_at").on(table.trashedAt),
]));

export const contributions = sqliteTable("contributions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  giftId: text("gift_id").notNull().references(() => gifts.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").default("usd"),
  contributorName: text("contributor_name"),
  contributorNote: text("contributor_note"),
  contributorImageUrl: text("contributor_image_url"),
  contributorUserId: text("contributor_user_id"),
  contributorEmail: text("contributor_email"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").default("pending"),
  notificationsSentAt: text("notifications_sent_at"),
  idempotencyKey: text("idempotency_key"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at"),
}, (table) => ([
  index("idx_contributions_gift_id").on(table.giftId),
  index("idx_contributions_checkout_session").on(table.stripeCheckoutSessionId),
  index("idx_contributions_payment_intent").on(table.stripePaymentIntentId),
  uniqueIndex("idx_contributions_idempotency_key").on(table.idempotencyKey),
]));

export const webhookEventLog = sqliteTable("webhook_event_log", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  status: text("status").notNull().default("claimed"),
  processedAt: text("processed_at").default(sql`(datetime('now'))`),
});

export const reactions = sqliteTable("reactions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  contributionId: text("contribution_id").notNull().references(() => contributions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (table) => ([
  index("idx_reactions_contribution_id").on(table.contributionId),
  uniqueIndex("reactions_contribution_user_type").on(table.contributionId, table.userId, table.reactionType),
]));

export const emailSubscribers = sqliteTable("email_subscribers", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text("email").notNull(),
  source: text("source").notNull(),
  userId: text("user_id").references(() => users.id),
  eventMonth: integer("event_month"),
  eventYear: integer("event_year"),
  referrerPath: text("referrer_path"),
  unsubscribedAt: text("unsubscribed_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ([
  uniqueIndex("idx_email_subscribers_dedup").on(table.email, table.source, table.eventYear, table.eventMonth),
  index("idx_email_subscribers_source").on(table.source),
  index("idx_email_subscribers_event").on(table.eventYear, table.eventMonth),
]));
