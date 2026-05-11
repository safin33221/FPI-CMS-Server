import express, { Router } from 'express';
import multer from 'multer';
import { tmpdir } from 'node:os';
import { StudentController } from './student.controller.js';

const router: Router = express.Router();
const upload = multer({ dest: tmpdir() });

router.post('/import', upload.single('file'), StudentController.importStudents);

export const studentRoute: Router = router;
