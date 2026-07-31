import { Router } from "express";

import { staffController } from "./staff.controller.js";

import { authenticate } from "../../middleware/Authenticate.js";
import { Role } from "@prisma/client";
import { authorize } from "../../middleware/authorize.js";

const router: Router = Router();

router.get(
    "/:id",
    authenticate,
    staffController.getSingleStaff
);

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
    "/department/teachers",
    authenticate,
    staffController.getDepartmentTeachers
);



export const StaffRoutes = router;