import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
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
                throw new AppError(
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
        throw new AppError(
            httpCode.NOT_FOUND,
            "User not found"
        );
    }

    const where: any = {};

    if (user.role === "DEPARTMENT_HEAD") {
        if (!user.teacher) {
            throw new AppError(
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
        throw new AppError(
            httpCode.NOT_FOUND,
            "Subject not found"
        );
    }

    return subject;
};

const assignTeacher = async (
    subjectId: string,
    payload: {
        teacherId?: string;
        semesterId?: string;
        subjectAssignmentId?: string;
        academicSessionId?: string;
        sessionId?: string;
    },
    currentUser: { id: string; role: string }
) => {
    if (!payload.teacherId) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "teacherId is required"
        );
    }

    const teacherId = payload.teacherId;
    const subjectAssignmentId =
        payload.subjectAssignmentId;
    const semesterId = payload.semesterId;
    const academicSessionId =
        payload.academicSessionId ?? payload.sessionId;

    const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            select: { id: true },
        });

        if (!subject) {
            throw new AppError(
                httpCode.NOT_FOUND,
                "Subject not found"
            );
        }

    const departmentHead = currentUser.role === "DEPARTMENT_HEAD"
        ? await prisma.teacher.findUnique({
                where: { userId: currentUser.id },
                select: { departmentId: true },
            })
            : null;

    if (currentUser.role === "DEPARTMENT_HEAD" && !departmentHead) {
            throw new AppError(
                httpCode.FORBIDDEN,
                "Department head profile not found"
            );
        }

    const subjectAssignments =
        await prisma.subjectAssignment.findMany({
                where: {
                    subjectId,
                    ...(subjectAssignmentId
                        ? { id: subjectAssignmentId }
                        : semesterId
                            ? { semesterId }
                            : {}),
                    ...(departmentHead
                        ? { departmentId: departmentHead.departmentId }
                        : {}),
                },
                include: {
                    subject: true,
                    semester: true,
                    department: true,
                },
                take: 2,
            });

    if (subjectAssignments.length === 0) {
            throw new AppError(
                httpCode.NOT_FOUND,
                "Subject is not assigned to the specified semester"
            );
        }

    if (subjectAssignments.length > 1) {
            throw new AppError(
                httpCode.BAD_REQUEST,
                "semesterId is required because this subject is assigned to multiple semesters"
            );
        }

    const subjectAssignment = subjectAssignments[0]!;

    const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
            select: {
                id: true,
                departmentId: true,
            },
        });

    if (!teacher) {
            throw new AppError(
                httpCode.NOT_FOUND,
                "Teacher not found"
            );
        }

    if (teacher.departmentId !== subjectAssignment.departmentId) {
            throw new AppError(
                httpCode.BAD_REQUEST,
                "Teacher must belong to the subject's department"
            );
        }

    if (academicSessionId) {
        const academicSession =
            await prisma.academicSession.findUnique({
                    where: { id: academicSessionId },
                    select: { id: true },
                });

        if (!academicSession) {
                throw new AppError(
                    httpCode.NOT_FOUND,
                    "Academic session not found"
                );
        }
    }

    await prisma.teachingAssignment.updateMany({
        where: {
            subjectAssignmentId: subjectAssignment.id,
            teacherId: { not: teacher.id },
            isActive: true,
        },
        data: { isActive: false },
    });

    return prisma.teachingAssignment.upsert({
        where: {
            teacherId_subjectAssignmentId: {
                teacherId: teacher.id,
                subjectAssignmentId: subjectAssignment.id,
            },
        },
        update: {
            isActive: true,
            academicSessionId: academicSessionId ?? null,
        },
        create: {
            teacherId: teacher.id,
            subjectAssignmentId: subjectAssignment.id,
            academicSessionId: academicSessionId ?? null,
        },
        include: {
            teacher: { include: { user: true } },
            subjectAssignment: {
                include: {
                    subject: true,
                    semester: true,
                    department: true,
                },
            },
            academicSession: true,
        },
    });
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
        throw new AppError(
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
        throw new AppError(
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
        throw new AppError(
            httpCode.NOT_FOUND,
            "Subject not found"
        );
    }

    if (
        subject.subjectAssignments.length >
        0
    ) {
        throw new AppError(
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
    assignTeacher,
    updateSubject,
    deleteSubject,
};
