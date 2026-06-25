import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";

const createDepartment = async (payload: {
    name: string;
    code: string;
    headId?: string;
}) => {

    const existingDepartment =
        await prisma.department.findFirst({
            where: {
                OR: [
                    {
                        name: payload.name,
                    },
                    {
                        code: payload.code,
                    },
                ],
            },
        });

    if (existingDepartment) {
        throw new ApiError(
            httpCode.CONFLICT,
            "Department already exists"
        );
    }

    if (payload.headId) {
        const teacher =
            await prisma.teacher.findUnique({
                where: {
                    id: payload.headId,
                },
            });

        if (!teacher) {
            throw new ApiError(
                httpCode.NOT_FOUND,
                "Department head not found"
            );
        }
    }

    const departmentData: {
        name: string;
        code: string;
        headId?: string;
    } = {
        name: payload.name,
        code: payload.code,
    };

    if (payload.headId) {
        departmentData.headId = payload.headId;
    }

    const department =
        await prisma.department.create({
            data: departmentData,
            include: {
                head: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

    return department;
};

const getAllDepartment = async () => {
    const departments =
        await prisma.department.findMany({
            include: {
                head: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

    return departments;
};

const getSingleDepartment = async (
    departmentId: string
) => {
    const department =
        await prisma.department.findUnique({
            where: {
                id: departmentId,
            },
            include: {
                head: {
                    include: {
                        user: true,
                    },
                },
                teachers: true,
                students: true,
            },
        });

    if (!department) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Department not found"
        );
    }

    return department;
};

const updateDepartment = async (
    departmentId: string,
    payload: {
        name?: string;
        code?: string;
        headId?: string;
    }
) => {

    const department =
        await prisma.department.findUnique({
            where: {
                id: departmentId,
            },
        });

    if (!department) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Department not found"
        );
    }

    if (payload.headId) {
        const teacher =
            await prisma.teacher.findUnique({
                where: {
                    id: payload.headId,
                },
            });

        if (!teacher) {
            throw new ApiError(
                httpCode.NOT_FOUND,
                "Department head not found"
            );
        }
    }

    const updatedDepartment =
        await prisma.department.update({
            where: {
                id: departmentId,
            },
            data: payload,
            include: {
                head: {
                    include: {
                        user: true,
                    },
                },
            },
        });

    return updatedDepartment;
};

const deleteDepartment = async (
    departmentId: string
) => {

    const department =
        await prisma.department.findUnique({
            where: {
                id: departmentId,
            },
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                    },
                },
            },
        });

    if (!department) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Department not found"
        );
    }

    if (
        department._count.students > 0 ||
        department._count.teachers > 0
    ) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Cannot delete department with students or teachers"
        );
    }

    await prisma.department.delete({
        where: {
            id: departmentId,
        },
    });

    return null;
};

export const departmentService = {
    createDepartment,
    getAllDepartment,
    getSingleDepartment,
    updateDepartment,
    deleteDepartment,
};