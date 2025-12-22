import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import express from "express";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({ 
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);

  // Serve uploaded files statically (protected by auth middleware typically, but keeping simple for MVP)
  app.use("/uploads", express.static(uploadsDir));

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // === REPORTS ===
  app.get(api.reports.list.path, requireAuth, async (req, res) => {
    const reports = await storage.getReports(req.user!.id);
    res.json(reports);
  });

  app.post(api.reports.create.path, requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Multer file is available at req.file
      // Fields are at req.body
      const reportData = {
        title: req.body.title,
        type: req.body.type,
        reportDate: req.body.reportDate,
        summary: req.body.summary,
      };

      // Manually validate since body is multipart
      // We accept strings, so basic check
      if (!reportData.title || !reportData.type || !reportData.reportDate) {
         return res.status(400).json({ message: "Missing required fields" });
      }

      const report = await storage.createReport({
        ...reportData,
        userId: req.user!.id,
        filePath: `/uploads/${req.file.filename}`
      });
      
      res.status(201).json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.reports.get.path, requireAuth, async (req, res) => {
    const report = await storage.getReport(Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Report not found" });
    // Basic check: owner or shared
    if (report.userId !== req.user!.id) {
       // TODO: Check shares
       return res.status(403).json({ message: "Forbidden" });
    }
    res.json(report);
  });

  app.delete(api.reports.delete.path, requireAuth, async (req, res) => {
    const report = await storage.getReport(Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.userId !== req.user!.id) {
       return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteReport(report.id);
    res.status(204).send();
  });

  // === VITALS ===
  app.get(api.vitals.list.path, requireAuth, async (req, res) => {
    const vitals = await storage.getVitals(req.user!.id);
    res.json(vitals);
  });

  app.post(api.vitals.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.vitals.create.input.parse(req.body);
      // Force date to be date object if string
      const vital = await storage.createVital({
        ...input,
        date: new Date(input.date),
        userId: req.user!.id
      });
      res.status(201).json(vital);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === SHARES ===
  app.post(api.shares.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.shares.create.input.parse(req.body);
      
      // Verify report ownership
      const report = await storage.getReport(input.reportId);
      if (!report || report.userId !== req.user!.id) {
        return res.status(404).json({ message: "Report not found or not owned" });
      }

      // Verify target user exists
      const targetUser = await storage.getUserByUsername(input.sharedWithUsername);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      const share = await storage.shareReport({
        ...input,
        sharedByUserId: req.user!.id
      });
      res.status(201).json(share);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.shares.list.path, requireAuth, async (req, res) => {
    const sharedReports = await storage.getSharedReports(req.user!.username);
    res.json(sharedReports);
  });

  // Seed Data
  const existingUsers = await storage.getUserByUsername("admin");
  if (!existingUsers) {
    const { scrypt, randomBytes } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);
    
    async function hashPassword(password: string) {
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      return `${buf.toString("hex")}.${salt}`;
    }

    const hashedPassword = await hashPassword("admin123");
    const admin = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      role: "owner"
    });

    const report = await storage.createReport({
      userId: admin.id,
      title: "Annual Blood Work",
      type: "Blood Test",
      reportDate: new Date().toISOString(),
      summary: "All values within normal range.",
      filePath: "/uploads/sample-report.pdf" // Placeholder
    });

    await storage.createVital({
      userId: admin.id,
      type: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      date: new Date()
    });
    
    await storage.createVital({
      userId: admin.id,
      type: "Heart Rate",
      value: "72",
      unit: "bpm",
      date: new Date()
    });
  }

  return httpServer;
}
