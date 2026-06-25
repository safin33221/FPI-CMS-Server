import { Router } from "express";

import { staffController } from "./staff.controller.js";

import { authenticate } from "../../middleware/Authenticate.js";
import { Role } from "@prisma/client";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize(Role.ADMIN),
    staffController.createStaff
);

router.get(
    "/",
    authenticate,
    staffController.getAllStaff
);

router.get(
    "/:id",
    authenticate,
    staffController.getSingleStaff
);

export const StaffRoutes = router;