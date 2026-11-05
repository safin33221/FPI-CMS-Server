import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/Authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { roomController } from "./room.controller.js";

const router = Router();
router.get("/", authenticate, roomController.getAllRooms);
router.post("/", authenticate, authorize(Role.ADMIN), roomController.createRoom);
export const RoomRoutes: Router = router;
