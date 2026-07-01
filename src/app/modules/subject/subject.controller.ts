import type {
    Request,
    Response,
    NextFunction,
} from "express";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";

import { subjectService } from "./subject.service.js";

const createSubjects = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const userId = (req as any).user.id
        const result =
            await subjectService.createSubjects(
                req.body,
                userId
            );

        sendResponse(res, {
            status: httpCode.CREATED,
            success: true,
            message:
                "Subject created successfully",
            data: result,
        });
    }
);

const getAllSubjects = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const userId = (req as any).user.id
        const result =
            await subjectService.getAllSubjects(userId);

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Subjects retrieved successfully",
            data: result,
        });
    }
);

const getSingleSubject = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await subjectService.getSingleSubject(
                req.params.id as string
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Subject retrieved successfully",
            data: result,
        });
    }
);

const updateSubject = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await subjectService.updateSubject(
                req.params.id as string,
                req.body
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Subject updated successfully",
            data: result,
        });
    }
);

const deleteSubject = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        await subjectService.deleteSubject(
            req.params.id as string
        );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Subject deleted successfully",
            data: null,
        });
    }
);


export const subjectController = {
    createSubjects,
    getAllSubjects,
    getSingleSubject,
    updateSubject,
    deleteSubject,

};