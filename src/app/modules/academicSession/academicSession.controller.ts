import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import { academicSessionService } from "./academicSession.service.js";

const createAcademicSession = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await academicSessionService.createAcademicSession(req.body);
        sendResponse(res, {
            status: httpCode.CREATED,
            success: true,
            message: "Academic session created successfully",
            data: result,
        });
    }
);

const getAllAcademicSessions = catchAsync(
    async (_req: Request, res: Response, _next: NextFunction) => {
        const result = await academicSessionService.getAllAcademicSessions();
        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Academic sessions retrieved successfully",
            data: result,
        });
    }
);

const getCurrentAcademicSession = catchAsync(
    async (_req: Request, res: Response, _next: NextFunction) => {
        const result = await academicSessionService.getCurrentAcademicSession();
        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Current academic session retrieved successfully",
            data: result,
        });
    }
);

const setCurrentAcademicSession = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await academicSessionService.setCurrentAcademicSession(
            req.params.id as string
        );
        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Academic session set as current successfully",
            data: result,
        });
    }
);

const updateAcademicSession = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await academicSessionService.updateAcademicSession(
            req.params.id as string,
            req.body
        );
        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Academic session updated successfully",
            data: result,
        });
    }
);

const deleteAcademicSession = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await academicSessionService.deleteAcademicSession(
            req.params.id as string
        );
        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: result.message,
            data: result,
        });
    }
);

export const academicSessionController = {
    createAcademicSession,
    getAllAcademicSessions,
    getCurrentAcademicSession,
    setCurrentAcademicSession,
    updateAcademicSession,
    deleteAcademicSession,
};

