import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";


const getAllUser = async (query: any) => {
    // implement logic here
}

const getSingleUser = async (userId: string) => {
    // implement logic here
}



const getMyProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(httpCode.NOT_FOUND, "User not found");
    }


    return user;
};



const updateUser = async (
    userId: string,
    payload: any
) => {
    // implement logic here
}

const updateProfile = async (
    userId: string,
    payload: any
) => {
    // implement logic here
}

const updateUserStatus = async (
    userId: string,
    payload: any
) => {
    // implement logic here
}

const updateUserRole = async (
    userId: string,
    payload: any
) => {
    // implement logic here
}

const changePassword = async (
    userId: string,
    payload: any
) => {
    // implement logic here
}

const resetPassword = async (
    payload: any
) => {
    // implement logic here
}

const uploadAvatar = async (
    userId: string,
    file: any
) => {
    // implement logic here
}

const deleteUser = async (userId: string) => {
    // implement logic here
}

export const userService = {


    getAllUser,
    getSingleUser,
    getMyProfile,

    updateUser,
    updateProfile,

    updateUserStatus,
    updateUserRole,

    uploadAvatar,

    deleteUser,
}