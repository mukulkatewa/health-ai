import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express'; // Add this import

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => { // Add types here
  try {
    const { email, password, name, role, ...extraData } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        ...(role === 'PATIENT' && {
          patient: { create: extraData }
        }),
        ...(role === 'DOCTOR' && {
          doctor: { create: extraData }
        })
      },
      include: { patient: true, doctor: true }
    });
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message }); // Fix error type
  }
};

export const login = async (req: Request, res: Response) => { // Add types here
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { patient: true, doctor: true }
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message }); // Fix error type
  }
};