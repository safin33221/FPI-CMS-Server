import express, { Router } from 'express';
import multer from 'multer';
import { tmpdir } from 'node:os';
import { StudentController } from './student.controller.js';
import { authenticate } from '../../middleware/Authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@prisma/client';


const router: Router = express.Router();

router.get("/",
    authenticate,
    authorize(Role.ADMIN, Role.REGISTRAR),
    StudentController.getAllStudent)

router.post('/verify-student', StudentController.verifyStudent);


export const StudentRoutes: Router = router;
