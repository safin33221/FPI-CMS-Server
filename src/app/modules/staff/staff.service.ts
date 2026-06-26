



import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";
import { Role } from "@prisma/client";

const STAFF_ROLES: Role[] = [
    "ADMIN",
    "REGISTRAR",
    "ACCOUNTANT",
    "TEACHER",
    "DEPARTMENT_HEAD",
    "EXAM_CONTROLLER",
];

export const createStaff = async (payload: any) => {
    if (!STAFF_ROLES.includes(payload.role)) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Invalid staff role"
        );
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: payload.email },
                { phone: payload.phone },
            ],
        },
    });

    if (existingUser) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Email or phone already exists"
        );
    }

    if (
        payload.role === "TEACHER" ||
        payload.role === "DEPARTMENT_HEAD"
    ) {
        const department =
            await prisma.department.findUnique({
                where: {
                    id: payload.departmentId,
                },
            });

        if (!department) {
            throw new ApiError(
                httpCode.NOT_FOUND,
                "Department not found"
            );
        }
    }


    const result = await prisma.$transaction(
        async (tx) => {
            const lastUser = await tx.user.findFirst({
                where: {
                    role: {
                        in: [
                            "PRINCIPAL",
                            "ADMIN",
                            "REGISTRAR",
                            "ACCOUNTANT",
                            "TEACHER",
                            "DEPARTMENT_HEAD",
                            "EXAM_CONTROLLER",
                        ],
                    },
                },
                orderBy: {
                    loginId: "desc",
                },
                select: {
                    loginId: true,
                },
            });

            const nextLoginId = lastUser
                ? Number(lastUser.loginId) + 1
                : 1001;

            const loginId =
                nextLoginId.toString();


            const tempPassword = `FPI@${loginId}`;


            const hashedPassword =
                await bcrypt.hash(tempPassword, 10);

            const user =
                await tx.user.create({
                    data: {
                        name: payload.name,
                        email: payload.email,
                        phone: payload.phone,
                        address: payload.address,
                        gender: payload.gender,

                        role: payload.role,

                        loginId,

                        password:
                            hashedPassword,

                        isVerified: true,
                        mustChangePassword: true,
                    },
                });

            if (
                payload.role === "TEACHER" ||
                payload.role ===
                "DEPARTMENT_HEAD"
            ) {
                await tx.teacher.create({
                    data: {
                        userId: user.id,

                        teacherId: loginId,
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
                loginId,
                password: tempPassword,
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