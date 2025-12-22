import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("owner").notNull(), // 'owner' or 'viewer'
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'Blood Test', 'X-Ray', 'MRI', etc.
  reportDate: text("report_date").notNull(), // SQLite stores dates as text
  filePath: text("file_path").notNull(),
  summary: text("summary"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const vitals = sqliteTable("vitals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'Blood Pressure', 'Blood Sugar', 'Heart Rate', 'Weight'
  value: text("value").notNull(), // Store as text to handle '120/80' format
  unit: text("unit").notNull(), // 'mmHg', 'mg/dL', 'bpm', 'kg'
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const shares = sqliteTable("shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: integer("report_id").notNull().references(() => reports.id),
  sharedByUserId: integer("shared_by_user_id").notNull().references(() => users.id),
  sharedWithUsername: text("shared_with_username").notNull(), // Simple sharing by username
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  vitals: many(vitals),
  shares: many(shares),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  shares: many(shares),
}));

export const vitalsRelations = relations(vitals, ({ one }) => ({
  user: one(users, {
    fields: [vitals.userId],
    references: [users.id],
  }),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  report: one(reports, {
    fields: [shares.reportId],
    references: [reports.id],
  }),
  sharedByUser: one(users, {
    fields: [shares.sharedByUserId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, userId: true, filePath: true });
export const insertVitalSchema = createInsertSchema(vitals).omit({ id: true, createdAt: true, userId: true });
export const insertShareSchema = createInsertSchema(shares).omit({ id: true, createdAt: true, sharedByUserId: true });

// === EXPLICIT API CONTRACT TYPES ===

// User
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Reports
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type CreateReportRequest = InsertReport; // File handled separately in multipart
export type ReportResponse = Report;

// Vitals
export type Vital = typeof vitals.$inferSelect;
export type InsertVital = z.infer<typeof insertVitalSchema>;
export type CreateVitalRequest = InsertVital;
export type VitalResponse = Vital;

// Shares
export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;
export type CreateShareRequest = InsertShare;
export type ShareResponse = Share;
