import { Router } from "express";
import { userController } from "./user.controller.js";
import { authenticate } from "../../middleware/Authenticate.js";



const router: Router = Router();

router.get("/", userController.getAllUser);

router.get("/me", authenticate, userController.getMyProfile);

router.get("/:id", userController.getSingleUser);

router.patch("/update-profile", userController.updateProfile);

router.patch("/:id", userController.updateUser);

router.patch("/:id/status", userController.updateUserStatus);

router.patch("/:id/role", userController.updateUserRole);

router.patch("/upload-avatar", userController.uploadAvatar);

router.delete("/:id", userController.deleteUser);

export const UserRoutes: Router = router;