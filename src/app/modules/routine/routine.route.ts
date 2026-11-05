import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/Authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { routineController } from "./routine.controller.js";

const router = Router();
router.get("/", authenticate, authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), routineController.getRoutines);
router.post("/", authenticate, authorize(Role.DEPARTMENT_HEAD), routineController.createRoutine);
router.delete("/:id", authenticate, authorize(Role.DEPARTMENT_HEAD), routineController.deleteRoutine);
export const RoutineRoutes: Router = router;
