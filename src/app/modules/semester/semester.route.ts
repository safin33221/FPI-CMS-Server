import { Router } from "express";

import { authenticate } from "../../middleware/Authenticate.js";

import { semesterController } from "./semester.controller.js";

const router: Router = Router();

router.get(
    "/",
    authenticate,
    semesterController.getAllSemester
);

router.get(
    "/:id",
    authenticate,
    semesterController.getSingleSemester
);

export const SemesterRoutes: Router = router;