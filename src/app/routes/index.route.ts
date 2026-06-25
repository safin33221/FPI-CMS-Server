import express, { Router } from "express";
import { authRoute } from "../modules/auth/auth.route.js";
import { studentRoute } from "../modules/student/student.route.js";
import { UserRoutes } from "../modules/user/user.route.js";
import { DepartmentRoutes } from "../modules/department/department.route.js";
import { SemesterRoutes } from "../modules/semester/semester.route.js";

const router: Router = express.Router();

const modulesRoutes = [
    {
        path: "/auth",
        route: authRoute
    },
    {
        path: "/students",
        route: studentRoute
    },
    {
        path: "/user",
        route: UserRoutes
    },
    {
        path: "/department",
        route: DepartmentRoutes
    },
    {
        path: "/semester",
        route: SemesterRoutes
    },
]


modulesRoutes.forEach((module) => router.use(module.path, module.route));

export default router;
