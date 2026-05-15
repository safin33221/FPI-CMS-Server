import express, { Router } from 'express';
import { authController } from './auth.controller.js';
const router: Router = express.Router();


router.post("/student/register", authController.registerStudent);
router.post("/login", authController.login)


export const authRoute: Router = router;
