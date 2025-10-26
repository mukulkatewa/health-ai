import express from 'express';
import { register, login } from '../controllers/authController.js';
import { getHealthHistory, getAIInsights } from '../controllers/patientController.js';
import { 
  createHealthRecord, 
  getPatients, 
  searchPatients,
  getPatientById 
} from '../controllers/doctorController.js';
import { chatWithAI, generateHealthPrediction } from '../controllers/aiController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { 
  apiLimiter, 
  authLimiter, 
  searchLimiter, 
  aiLimiter 
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Auth routes (with strict rate limiting)
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);

// Patient routes
router.get(
  '/patient/health-history', 
  apiLimiter,
  authenticate, 
  requireRole(['PATIENT']), 
  getHealthHistory
);
router.get(
  '/patient/ai-insights', 
  apiLimiter,
  authenticate, 
  requireRole(['PATIENT']), 
  getAIInsights
);

// Doctor routes (with search rate limiting)
router.get(
  '/doctor/patients', 
  apiLimiter,
  authenticate, 
  requireRole(['DOCTOR']), 
  getPatients
);
router.get(
  '/doctor/search-patients', 
  searchLimiter, // Specific rate limit for search
  authenticate, 
  requireRole(['DOCTOR']), 
  searchPatients
);
router.get(
  '/doctor/patient/:patientId', 
  apiLimiter,
  authenticate, 
  requireRole(['DOCTOR']), 
  getPatientById
);
router.post(
  '/doctor/health-record', 
  apiLimiter,
  authenticate, 
  requireRole(['DOCTOR']), 
  createHealthRecord
);

// AI routes (with stricter rate limiting due to API costs)
router.post(
  '/ai/chat', 
  aiLimiter,
  authenticate, 
  requireRole(['PATIENT']), 
  chatWithAI
);
router.post(
  '/ai/predict', 
  aiLimiter,
  authenticate, 
  requireRole(['PATIENT']), 
  generateHealthPrediction
);

export default router;