import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  accessLevel: text("access_level").notNull(),
  clientId: text("client_id").notNull(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;