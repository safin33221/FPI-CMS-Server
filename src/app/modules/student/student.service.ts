import { Prisma } from "@prisma/client";

import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";

const getAllStudent = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  semesterId?: string;
  session?: string;
  gender?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {};

  //---------------------------------------
  // Search
  //---------------------------------------

  if (query.search) {
    where.OR = [
      {
        name: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        roll: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        registrationNo: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  //---------------------------------------
  // Filters
  //---------------------------------------

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.semesterId) {
    where.semesterId = query.semesterId;
  }

  if (query.session) {
    where.session = query.session;
  }


  //---------------------------------------
  // Sorting
  //---------------------------------------

  const orderBy: Prisma.StudentOrderByWithRelationInput =
    query.sortBy
      ? {
        [query.sortBy]:
          query.sortOrder === "asc"
            ? "asc"
            : "desc",
      }
      : {
        createdAt: "desc",
      };

  //---------------------------------------

  const [students, total] =
    await Promise.all([
      prisma.student.findMany({
        where,

        skip,
        take: limit,

        orderBy,

        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          semester: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },

          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              loginId: true,
              isActive: true,
            },
          },
        },
      }),

      prisma.student.count({
        where,
      }),
    ]);

  //---------------------------------------

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },

    data: students,
  };
};


const verifyStudent = async (data: {
  roll: string;
  registrationNo: string;
  phone: string;
}) => {

  console.log(data.roll);
  console.log(data.registrationNo);
  console.log(data.phone);

  const student = await prisma.student.findFirst({
    where: {
      roll: data.roll,
      registrationNo: data.registrationNo,
      phone: data.phone,
    },
    select: {
      id: true,
      name: true,
      roll: true,
      registrationNo: true,
      dob: true,
      phone: true,

      department: {
        select: { name: true },
      },

      semester: {
        select: { name: true },
      },
    },
  })

  if (!student) {
    return new ApiError(httpCode.NOT_FOUND, "No matching student found. Please check your credentials.");
  }
  return {
    success: true,
    studentId: student.id,
    name: student.name,
    roll: student.roll,
    registrationNo: student.registrationNo,
    dob: student.dob,
    phone: student.phone,

    department: student.department?.name,
    semester: student.semester?.name,

  }
};

export const StudentService = {
  getAllStudent,
  verifyStudent
};