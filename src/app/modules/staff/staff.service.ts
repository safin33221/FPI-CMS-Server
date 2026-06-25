import bcrypt from "bcrypt";

import { prisma } from "../../../lib/prisma.js";

import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";

const createStaff = async (payload: any) => {
    const existingUser =
        await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

    if (existingUser) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Email already exists"
        );
    }

    const password =
        Math.random()
            .toString(36)
            .slice(-8);

    const hashedPassword =
        await bcrypt.hash(password, 10);

    const result =
        await prisma.$transaction(
            async (tx) => {
                const user =
                    await tx.user.create({
                        data: {
                            name: payload.name,
                            email: payload.email,
                            password:
                                hashedPassword,

                            role: payload.role,

                            phone:
                                payload.phone,

                            address:
                                payload.address,

                            gender:
                                payload.gender,

                            isVerified: true,
                        },
                    });

                const teacherRoles = [
                    "TEACHER",
                    "DEPARTMENT_HEAD",
                ];

                if (
                    teacherRoles.includes(
                        payload.role
                    )
                ) {
                    await tx.teacher.create({
                        data: {
                            userId: user.id,

                            teacherId: `T-${Date.now()}`,

                            designation:
                                payload.designation,

                            qualification:
                                payload.qualification,

                            joiningDate:
                                payload.joiningDate
                                    ? new Date(
                                          payload.joiningDate
                                      )
                                    : null,

                            experienceYears:
                                payload.experienceYears
                                    ? Number(
                                          payload.experienceYears
                                      )
                                    : null,

                            departmentId:
                                payload.departmentId,
                        },
                    });
                }

                return {
                    user,
                    password,
                };
            }
        );

    return result;
};

const getAllStaff = async () => {
    return prisma.user.findMany({
        where: {
            role: {
                in: [
                    "REGISTRAR",
                    "DEPARTMENT_HEAD",
                    "TEACHER",
                    "ACCOUNTANT",
                    "EXAM_CONTROLLER",
                ],
            },
        },

        include: {
            teacher: {
                include: {
                    department: true,
                },
            },
        },

        orderBy: {
            createdAt: "desc",
        },
    });
};

const getSingleStaff = async (
    staffId: string
) => {
    const staff =
        await prisma.user.findUnique({
            where: {
                id: staffId,
            },

            include: {
                teacher: {
                    include: {
                        department: true,
                    },
                },
            },
        });

    if (!staff) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Staff not found"
        );
    }

    return staff;
};

export const staffService = {
    createStaff,
    getAllStaff,
    getSingleStaff,
};