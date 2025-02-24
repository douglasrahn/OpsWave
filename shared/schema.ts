import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  accessLevel: text("access_level").notNull(),
  clientId: text("client_id").notNull(),
  provider: text("provider"),
  providerId: text("provider_id"),
  displayName: text("display_name"),
  email: text("email"),
});

export const oauthTokens = pgTable("oauth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: text("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  url: text("url").notNull(),
  collectionsScenarioId: text("collections_scenario_id"),
  salesQualifierScenarioId: text("sales_qualifier_scenario_id"),
  surveyScenarioId: text("survey_scenario_id"),
  collectionsEnabled: boolean("collections_enabled").default(false),
  salesQualifierEnabled: boolean("sales_qualifier_enabled").default(false),
  surveyEnabled: boolean("survey_enabled").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  accessLevel: true,
  clientId: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  companyName: true,
  url: true,
  collectionsScenarioId: true,
  salesQualifierScenarioId: true,
  surveyScenarioId: true,
});

export const insertOAuthTokenSchema = createInsertSchema(oauthTokens).pick({
  userId: true,
  provider: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertOAuthToken = z.infer<typeof insertOAuthTokenSchema>;
export type OAuthToken = typeof oauthTokens.$inferSelect;