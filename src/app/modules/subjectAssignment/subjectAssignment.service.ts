import { prisma } from "../../../lib/prisma.js";

import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

const assignSubjects = async (
    payload: any,
    userId: string
) => {
    console.log(payload);
    if (
        !payload.subjects ||
        !Array.isArray(payload.subjects) ||
        payload.subjects.length === 0
    ) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "At least one subject is required"
        );
    }

    const teacher =
        await prisma.teacher.findUnique({
            where: {
                userId,
            },

            select: {
                departmentId: true,
            },
        });

    if (!teacher) {
        throw new AppError(
            httpCode.NOT_FOUND,
            "Department not found"
        );
    }

    const semester =
        await prisma.semester.findUnique({
            where: {
                id: payload.semesterId,
            },
        });

    if (!semester) {
        throw new AppError(
            httpCode.NOT_FOUND,
            "Semester not found"
        );
    }

    return prisma.$transaction(async (tx) => {
        const assignments = [];

        for (const subjectId of payload.subjects) {
            const subject =
                await tx.subject.findUnique({
                    where: {
                        id: subjectId,
                    },
                });

            if (!subject) {
                throw new AppError(
                    httpCode.NOT_FOUND,
                    "Subject not found"
                );
            }

            const exists =
                await tx.subjectAssignment.findUnique({
                    where: {
                        subjectId_departmentId_semesterId:
                        {
                            subjectId,
                            departmentId:
                                teacher.departmentId,
                            semesterId:
                                payload.semesterId,
                        },
                    },
                });

            if (exists) {
                continue;
            }

            const created =
                await tx.subjectAssignment.create({
                    data: {
                        subjectId,

                        departmentId:
                            teacher.departmentId,

                        semesterId:
                            payload.semesterId,
                    },

                    include: {
                        subject: true,
                        semester: true,
                        department: true,
                    },
                });

            assignments.push(created);
        }

        return assignments;
    });
};

const getAllSubjectAssignments =
    async (userId: string) => {
        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },

                include: {
                    teacher: {
                        select: {
                            departmentId: true,
                        },
                    },
                },
            });

        if (!user) {
            throw new AppError(
                httpCode.NOT_FOUND,
                "User not found"
            );
        }

        const where: any = {};

        if (
            user.role ===
            "DEPARTMENT_HEAD"
        ) {
            where.departmentId =
                user.teacher?.departmentId;
        }

        return prisma.subjectAssignment.findMany({
            where,

            include: {
                subject: true,
                semester: true,
                department: true,

                teachingAssignments: {
                    include: {
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },

            orderBy: [
                {
                    semester: {
                        number: "asc",
                    },
                },
                {
                    subject: {
                        code: "asc",
                    },
                },
            ],
        });
    };


const getSingleSubjectAssignment =
    async (id: string) => {
        const assignment =
            await prisma.subjectAssignment.findUnique({
                where: {
                    id,
                },

                include: {
                    subject: true,
                    semester: true,
                    department: true,

                    teachingAssignments: {
                        include: {
                            teacher: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!assignment) {
            throw new AppError(
                httpCode.NOT_FOUND,
                "Assignment not found"
            );
        }

        return assignment;
    };


const deleteSubjectAssignment =
    async (id: string) => {
        const assignment =
            await prisma.subjectAssignment.findUnique({
                where: {
                    id,
                },

                include: {
                    teachingAssignments: true,
                },
            });

        if (!assignment) {
            throw new AppError(
                httpCode.NOT_FOUND,
                "Assignment not found"
            );
        }

        if (
            assignment
                .teachingAssignments
                .length > 0
        ) {
            throw new AppError(
                httpCode.BAD_REQUEST,
                "Teacher already assigned."
            );
        }

        await prisma.subjectAssignment.delete({
            where: {
                id,
            },
        });

        return null;
    };

export const subjectAssignmentService = {
    assignSubjects,
    getAllSubjectAssignments,
    getSingleSubjectAssignment,
    deleteSubjectAssignment
}