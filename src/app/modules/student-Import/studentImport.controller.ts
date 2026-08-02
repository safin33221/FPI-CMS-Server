import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { studentImportService } from "./studentImport.service.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import AppError from "../../error/AppError.js";


const previewImport = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {

        if (!req.file) {
            throw new AppError(
                httpCode.BAD_REQUEST,
                "Excel file is required."
            );
        }


        const result =
            await studentImportService.previewImport(
                req.file.filename
            );


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
    async (
        req: Request,
        res: Response
    ) => {

        const { fileId } = req.params;


        if (!fileId) {
            throw new AppError(
                httpCode.BAD_REQUEST,
                "File ID is required."
            );
        }


        const result =
            await studentImportService.getPreview(
                fileId as string
            );


        sendResponse(res, {
            success: true,
            status: httpCode.OK,
            message:
                "Preview fetched successfully",
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
            throw new AppError(
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
    getPreview,
};