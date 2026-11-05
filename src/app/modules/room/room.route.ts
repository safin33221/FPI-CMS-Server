import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/Authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { roomController } from "./room.controller.js";

const router = Router();

router.get("/", authenticate, roomController.getAllRooms);

router.post(
    "/",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    roomController.createRoom
);

router.patch(
    "/:id",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    roomController.updateRoom
);

router.delete(
    "/:id",
    authenticate,
    authorize(Role.ADMIN, Role.PRINCIPAL),
    roomController.deleteRoom
);

export const RoomRoutes: Router = router;

