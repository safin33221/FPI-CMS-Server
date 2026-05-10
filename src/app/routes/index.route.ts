import express, { Router } from "express";
import { authRoute } from "../modules/auth/auth.route.js";

const router: Router = express.Router();

const modulesRoutes = [
    {
        path: "/auth",
        route: authRoute
    }
]


modulesRoutes.forEach((module) => router.use(module.path, module.route));

export default router;