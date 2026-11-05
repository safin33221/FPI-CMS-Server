import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/Authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { academicSessionController } from "./academicSession.controller.js";

const router = Router();

// Any authenticated user can view sessions or get current session
router.get("/", authenticate, academicSessionController.getAllAcademicSessions);
router.get(
    "/current",
    authenticate,
    academicSessionController.getCurrentAcademicSession
);

// Admin & Principal can manage academic sessions
router.post(
    "/",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    academicSessionController.createAcademicSession
);

router.patch(
    "/:id/set-current",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    academicSessionController.setCurrentAcademicSession
);

router.patch(
    "/:id",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    academicSessionController.updateAcademicSession
);

router.delete(
    "/:id",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    academicSessionController.deleteAcademicSession
);

export const AcademicSessionRoutes: Router = router;

