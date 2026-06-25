import { Router } from "express";

import { authenticate } from "../../middleware/Authenticate.js";

import { departmentController } from "./department.controller.js";

const router: Router = Router();

router.post(
    "/",
    authenticate,
    departmentController.createDepartment
);

router.get(
    "/",
    // authenticate,
    departmentController.getAllDepartment
);

router.get(
    "/:id",
    authenticate,
    departmentController.getSingleDepartment
);

router.patch(
    "/:id",
    authenticate,
    departmentController.updateDepartment
);

router.delete(
    "/:id",
    authenticate,
    departmentController.deleteDepartment
);

export const DepartmentRoutes: Router = router;