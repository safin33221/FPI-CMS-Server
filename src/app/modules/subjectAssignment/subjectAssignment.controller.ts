import type {
    Request,
    Response,
    NextFunction,
} from "express";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";

import { subjectAssignmentService } from "./subjectAssignment.service.js";

const assignSubjects = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const userId = (req as any).user.id;

        const result =
            await subjectAssignmentService.assignSubjects(
                req.body,
                userId
            );

        sendResponse(res, {
            status: httpCode.CREATED,
            success: true,
            message:
                "Subjects assigned successfully",
            data: result,
        });
    }
);

const getAllSubjectAssignments =
    catchAsync(
        async (
            req: Request,
            res: Response,
            _next: NextFunction
        ) => {
            const userId =
                (req as any).user.id;

            const result =
                await subjectAssignmentService.getAllSubjectAssignments(
                    userId
                );

            sendResponse(res, {
                status: httpCode.OK,
                success: true,
                message:
                    "Subject assignments retrieved successfully",
                data: result,
            });
        }
    );

const getSingleSubjectAssignment =
    catchAsync(
        async (
            req: Request,
            res: Response,
            _next: NextFunction
        ) => {
            const result =
                await subjectAssignmentService.getSingleSubjectAssignment(
                    req.params.id as string
                );

            sendResponse(res, {
                status: httpCode.OK,
                success: true,
                message:
                    "Subject assignment retrieved successfully",
                data: result,
            });
        }
    );

const deleteSubjectAssignment =
    catchAsync(
        async (
            req: Request,
            res: Response,
            _next: NextFunction
        ) => {
            await subjectAssignmentService.deleteSubjectAssignment(
                req.params.id as string
            );

            sendResponse(res, {
                status: httpCode.OK,
                success: true,
                message:
                    "Subject assignment deleted successfully",
                data: null,
            });
        }
    );

export const subjectAssignmentController =
{
    assignSubjects,
    getAllSubjectAssignments,
    getSingleSubjectAssignment,
    deleteSubjectAssignment,
};