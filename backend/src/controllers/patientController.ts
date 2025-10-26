import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getHealthHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.user;

    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        healthRecords: {
          include: {
            doctor: { include: { user: true } },
            prescriptions: true,
            testResults: true,
          },
          orderBy: { visitDate: "desc" },
        },
        aiAnalyses: { orderBy: { analyzedAt: "desc" }, take: 5 },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching health history:", error);
    res.status(500).json({ error: "Failed to fetch health history" });
  }
};

export const getAIInsights = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.user;

    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        aiAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
      },
    });

    res.json(patient?.aiAnalyses[0] || null);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
};