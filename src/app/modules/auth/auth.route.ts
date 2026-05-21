import express, { Router } from 'express';
import { authController } from './auth.controller.js';
const router: Router = express.Router();


router.post("/student/register", authController.registerStudent);
router.post("/login", authController.login)
router.post("/logout", authController.logout)


export const authRoute: Router = router;
