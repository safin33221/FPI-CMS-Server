import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";

const getAllSemester = async () => {
    const semesters = await prisma.semester.findMany({
        include: {
            _count: {
                select: {
                    students: true,
                },
            },
        },
        orderBy: {
            number: "asc",
        },
    });

    return semesters;
};

const getSingleSemester = async (
    semesterId: string
) => {
    const semester =
        await prisma.semester.findUnique({
            where: {
                id: semesterId,
            },
            include: {
                _count: {
                    select: {
                        students: true,
                    },
                },
            },
        });

    if (!semester) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Semester not found"
        );
    }

    return semester;
};

export const semesterService = {
    getAllSemester,
    getSingleSemester,
};