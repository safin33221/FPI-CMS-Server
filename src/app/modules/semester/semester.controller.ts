import type {
    NextFunction,
    Request,
    Response,
} from "express";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";

import { semesterService } from "./semester.service.js";

const getAllSemester = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await semesterService.getAllSemester();

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Semesters retrieved successfully",
            data: result,
        });
    }
);

const getSingleSemester = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await semesterService.getSingleSemester(
                req.params.id as string
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Semester retrieved successfully",
            data: result,
        });
    }
);

export const semesterController = {
    getAllSemester,
    getSingleSemester,
};