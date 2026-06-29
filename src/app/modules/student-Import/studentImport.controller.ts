import type {
    NextFunction,
    Request,
    Response,
} from "express";

import fs from "fs/promises";



import { studentImportService } from "./studentImport.service.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import ApiError from "../../error/ApiError.js";

const previewImport = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {

        if (!req.file) {
            throw new Error("Excel file is required");
        }

        const result =
            await studentImportService.previewImport(
                req.file.path,
                req.file.filename,
            );
        console.log(req.file)

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Preview generated successfully",
            data: result,
        });
    }
);

const getPreview = catchAsync(
    async (req, res) => {
        const result =
            await studentImportService.getPreview(
                req.params.fileId as string
            );

        sendResponse(res, {
            success: true,
            status: 200,
            message: "Preview fetched successfully",
            data: result,
        });
    }
);

const commitImport = catchAsync(
    async (
        req: Request,
        res: Response
    ) => {

        const { fileId } = req.params;

        if (!fileId) {
            throw new ApiError(
                httpCode.BAD_REQUEST,
                "File ID is required."
            );
        }

        const result =
            await studentImportService.commitImport(
                fileId as string
            );

        sendResponse(res, {
            status: httpCode.CREATED,
            success: true,
            message:
                "Students imported successfully",
            data: result,
        });
    }
);

export const studentImportController = {
    previewImport,
    commitImport,
    getPreview
};