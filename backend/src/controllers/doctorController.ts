import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Enhanced search with pagination
export const searchPatients = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { 
      query = '', 
      page = '1', 
      limit = '10',
      sortBy = 'name',
      order = 'asc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const searchQuery = query as string;
    const whereCondition = searchQuery
      ? {
          user: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' as const } },
              { email: { contains: searchQuery, mode: 'insensitive' as const } }
            ]
          }
        }
      : {};

    const orderBy: any = 
      sortBy === 'name' || sortBy === 'email'
        ? { user: { [sortBy]: order as string } }
        : { [sortBy as string]: order as string };

    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          healthRecords: {
            select: {
              visitDate: true
            },
            orderBy: {
              visitDate: 'desc'
            },
            take: 1
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.patient.count({
        where: whereCondition
      })
    ]);

    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.user.name,
      email: patient.user.email,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      allergies: patient.allergies,
      lastVisit: patient.healthRecords[0]?.visitDate || null
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      patients: formattedPatients,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalItems: totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    res.status(500).json({ error: "Failed to search patients" });
  }
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.userId },
      include: {
        healthRecords: {
          include: {
            patient: { 
              include: { user: true } 
            },
          },
          orderBy: {
            visitDate: 'desc'
          }
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const patientMap = new Map();
    
    doctor.healthRecords.forEach(record => {
      const patientId = record.patient.id;
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: record.patient.id,
          name: record.patient.user.name,
          email: record.patient.user.email,
          dateOfBirth: record.patient.dateOfBirth,
          bloodGroup: record.patient.bloodGroup,
          phone: record.patient.phone,
          allergies: record.patient.allergies,
          lastVisit: record.visitDate,
          totalVisits: 1
        });
      } else {
        const existing = patientMap.get(patientId);
        existing.totalVisits += 1;
      }
    });

    const allPatients = Array.from(patientMap.values());
    const totalCount = allPatients.length;
    const paginatedPatients = allPatients.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      patients: paginatedPatients,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalItems: totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

// ✅ Fixed version without type parameter
export const getPatientById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        healthRecords: {
          include: {
            doctor: { include: { user: true } },
            prescriptions: true,
            testResults: true
          },
          orderBy: { visitDate: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({
      id: patient.id,
      name: patient.user.name,
      email: patient.user.email,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      phone: patient.phone,
      healthRecords: patient.healthRecords
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
};

export const createHealthRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { patientId, diagnosis, symptoms, notes, prescriptions, testResults } =
      req.body;

    if (!patientId || !diagnosis) {
      return res.status(400).json({ 
        error: "Patient ID and diagnosis are required" 
      });
    }

    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patientExists) {
      return res.status(404).json({ 
        error: "Patient not found",
        hint: "Use /api/doctor/search-patients to find the patient first"
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const record = await prisma.healthRecord.create({
      data: {
        patientId,
        doctorId: doctor.id,
        diagnosis,
        symptoms,
        notes,
        prescriptions: {
          create: prescriptions || [],
        },
        testResults: {
          create: testResults || [],
        },
      },
      include: { 
        prescriptions: true, 
        testResults: true,
        patient: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
    });

    res.json(record);
  } catch (error) {
    console.error("Error creating health record:", error);
    res.status(500).json({ error: "Failed to create health record" });
  }
};