import { Router } from "express";
import { Role } from "@prisma/client";

import { subjectAssignmentController } from "./subjectAssignment.controller.js";

import { authenticate } from "../../middleware/Authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize(Role.DEPARTMENT_HEAD),
    subjectAssignmentController.assignSubjects
);

router.get(
    "/",
    authenticate,
    authorize(
        Role.ADMIN,
        Role.DEPARTMENT_HEAD
    ),
    subjectAssignmentController.getAllSubjectAssignments
);

router.get(
    "/:id",
    authenticate,
    authorize(
        Role.ADMIN,
        Role.DEPARTMENT_HEAD
    ),
    subjectAssignmentController.getSingleSubjectAssignment
);

router.delete(
    "/:id",
    authenticate,
    authorize(Role.DEPARTMENT_HEAD),
    subjectAssignmentController.deleteSubjectAssignment
);

export const SubjectAssignmentRoutes = router;