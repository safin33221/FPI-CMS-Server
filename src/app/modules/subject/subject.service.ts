import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";
const createSubjects = async (
    payload: any,
    userId: string
) => {
    if (
        !payload.subjects ||
        !Array.isArray(payload.subjects) ||
        payload.subjects.length === 0
    ) {
        throw new ApiError(
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
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Department not found for this user"
        );
    }

    return prisma.$transaction(async (tx) => {
        const createdSubjects = [];

        for (const subject of payload.subjects) {
            const existingSubject =
                await tx.subject.findFirst({
                    where: {
                        OR: [
                            {
                                code: subject.code,
                            },
                            {
                                name: subject.name,
                            },
                        ],
                    },
                });

            if (existingSubject) {
                throw new ApiError(
                    httpCode.BAD_REQUEST,
                    `Subject "${subject.code}" already exists`
                );
            }

            const created =
                await tx.subject.create({
                    data: {
                        code: subject.code,
                        name: subject.name,

                        credit: Number(
                            subject.credit
                        ),

                        theoryMarks: Number(
                            subject.theoryMarks
                        ),

                        practicalMarks: Number(
                            subject.practicalMarks
                        ),

                        totalMarks: Number(
                            subject.totalMarks
                        ),

                        departmentId:
                            teacher.departmentId,
                    },
                });

            createdSubjects.push(created);
        }

        return createdSubjects;
    });
};
const getAllSubjects = async (
    userId: string
) => {
    const user = await prisma.user.findUnique({
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
        throw new ApiError(
            httpCode.NOT_FOUND,
            "User not found"
        );
    }

    const where: any = {};

    if (user.role === "DEPARTMENT_HEAD") {
        if (!user.teacher) {
            throw new ApiError(
                httpCode.NOT_FOUND,
                "Department not found"
            );
        }

        where.departmentId =
            user.teacher.departmentId;
    }

    return prisma.subject.findMany({
        where,

        include: {
            department: true,

            subjectAssignments: {
                include: {
                    department: true,

                    semester: true,

                    teachingAssignments: {
                        where: {
                            isActive: true,
                        },

                        include: {
                            teacher: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            },
        },

        orderBy: {
            code: "asc",
        },
    });
};

const getSingleSubject = async (
    subjectId: string
) => {
    const subject =
        await prisma.subject.findUnique({
            where: {
                id: subjectId,
            },

            include: {
                subjectAssignments: {
                    include: {
                        department: true,
                        semester: true,

                        teachingAssignments: {
                            where: {
                                isActive: true,
                            },

                            include: {
                                teacher: {
                                    include: {
                                        user: true,
                                    },
                                },

                                session: true,
                            },
                        },
                    },
                },
            },
        });

    if (!subject) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Subject not found"
        );
    }

    return subject;
};

const updateSubject = async (
    subjectId: string,
    payload: any
) => {
    const subject =
        await prisma.subject.findUnique({
            where: {
                id: subjectId,
            },
        });

    if (!subject) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Subject not found"
        );
    }

    const existingSubject =
        await prisma.subject.findFirst({
            where: {
                NOT: {
                    id: subjectId,
                },

                OR: [
                    {
                        code: payload.code,
                    },
                    {
                        name: payload.name,
                    },
                ],
            },
        });

    if (existingSubject) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Subject already exists"
        );
    }

    return prisma.subject.update({
        where: {
            id: subjectId,
        },

        data: {
            code: payload.code,
            name: payload.name,

            credit: payload.credit,

            theoryMarks:
                payload.theoryMarks,

            practicalMarks:
                payload.practicalMarks,

            totalMarks:
                payload.totalMarks,

            isActive:
                payload.isActive,
        },
    });
};

const deleteSubject = async (
    subjectId: string
) => {
    const subject =
        await prisma.subject.findUnique({
            where: {
                id: subjectId,
            },

            include: {
                subjectAssignments: true,
            },
        });

    if (!subject) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Subject not found"
        );
    }

    if (
        subject.subjectAssignments.length >
        0
    ) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "This subject is already assigned and cannot be deleted."
        );
    }

    await prisma.subject.delete({
        where: {
            id: subjectId,
        },
    });

    return null;
};

export const subjectService = {
    createSubjects,
    getAllSubjects,
    getSingleSubject,
    updateSubject,
    deleteSubject,
};