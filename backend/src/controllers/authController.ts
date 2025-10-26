import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express"; // Add this import
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  // Add types here
  try {
    const { email, password, name, role, ...extraData } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert dateOfBirth to DateTime format if it exists
    const patientData =
      role === "PATIENT" && extraData.dateOfBirth
        ? { ...extraData, dateOfBirth: new Date(extraData.dateOfBirth) }
        : extraData;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        ...(role === "PATIENT" && {
          patient: { create: patientData },
        }),
        ...(role === "DOCTOR" && {
          doctor: { create: extraData },
        }),
      },
      include: { patient: true, doctor: true },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message }); // Fix error type
  }
};

export const login = async (req: Request, res: Response) => {
  // Add types here
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { patient: true, doctor: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message }); // Fix error type
  }
};
