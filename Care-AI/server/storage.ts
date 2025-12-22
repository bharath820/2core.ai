import { db } from "./db";
import {
  users, reports, vitals, shares,
  type User, type InsertUser,
  type Report, type InsertReport,
  type Vital, type InsertVital,
  type Share, type InsertShare
} from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Reports
  getReports(userId: number): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport & { userId: number, filePath: string }): Promise<Report>;
  deleteReport(id: number): Promise<void>;

  // Vitals
  getVitals(userId: number, limit?: number): Promise<Vital[]>;
  getVitalsByType(userId: number, type: string): Promise<Vital[]>;
  createVital(vital: InsertVital & { userId: number }): Promise<Vital>;

  // Shares
  shareReport(share: InsertShare & { sharedByUserId: number }): Promise<Share>;
  getSharedReports(username: string): Promise<(Share & { report: Report })[]>;
}

export class DatabaseStorage implements IStorage {
  // === USER ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // === REPORTS ===
  async getReports(userId: number): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.reportDate));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async createReport(report: InsertReport & { userId: number, filePath: string }): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  // === VITALS ===
  async getVitals(userId: number, limit = 50): Promise<Vital[]> {
    return await db.select().from(vitals)
      .where(eq(vitals.userId, userId))
      .orderBy(desc(vitals.date))
      .limit(limit);
  }

  async getVitalsByType(userId: number, type: string): Promise<Vital[]> {
    return await db.select().from(vitals)
      .where(and(eq(vitals.userId, userId), eq(vitals.type, type)))
      .orderBy(desc(vitals.date));
  }

  async createVital(vital: InsertVital & { userId: number }): Promise<Vital> {
    const [newVital] = await db.insert(vitals).values(vital).returning();
    return newVital;
  }

  // === SHARES ===
  async shareReport(share: InsertShare & { sharedByUserId: number }): Promise<Share> {
    const [newShare] = await db.insert(shares).values(share).returning();
    return newShare;
  }

  async getSharedReports(username: string): Promise<(Share & { report: Report })[]> {
    const sharedItems = await db.select({
      share: shares,
      report: reports
    })
    .from(shares)
    .innerJoin(reports, eq(shares.reportId, reports.id))
    .where(eq(shares.sharedWithUsername, username))
    .orderBy(desc(shares.createdAt));

    return sharedItems.map(item => ({ ...item.share, report: item.report }));
  }
}

export const storage = new DatabaseStorage();
