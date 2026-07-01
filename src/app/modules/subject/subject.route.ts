import { Router } from "express";
import { Role } from "@prisma/client";

import { subjectController } from "./subject.controller.js";

import { authenticate } from "../../middleware/Authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize(
        Role.ADMIN,
        Role.DEPARTMENT_HEAD
    ),
    subjectController.createSubjects
);

router.get(
    "/",
    authenticate,
    subjectController.getAllSubjects
);

router.get(
    "/:id",
    authenticate,
    subjectController.getSingleSubject
);

router.patch(
    "/:id",
    authenticate,
    authorize(
        Role.ADMIN,
        Role.DEPARTMENT_HEAD
    ),
    subjectController.updateSubject
);

router.delete(
    "/:id",
    authenticate,
    authorize(
        Role.ADMIN,
        Role.DEPARTMENT_HEAD
    ),
    subjectController.deleteSubject
);



export const SubjectRoutes = router;