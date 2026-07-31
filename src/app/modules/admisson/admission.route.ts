import express, { Router } from 'express';
import { AdmissionControllers } from './admission.controller.js';
import { authenticate } from '../../middleware/Authenticate.js';

const router: Router = express.Router();

router.post(
    "/:studentId/confirm",
    authenticate,
    AdmissionControllers.confirmAdmission
);

export const AdmissionRoute = router