import { Router } from "express";



import { studentImportController } from "./studentImport.controller.js";
import { authenticate } from "../../middleware/Authenticate.js";
import { createUploader } from "../../middleware/upload.js";

const router = Router();

router.post(
    "/preview",
    authenticate,
    createUploader("file", "excel"),
    studentImportController.previewImport
);

router.get(
    "/preview/:fileId",
    authenticate,
    studentImportController.getPreview
);

router.post(
    "/commit/:fileId",
    authenticate,
    createUploader("file", "excel"),
    studentImportController.commitImport
);

export const StudentImportRoutes = router;