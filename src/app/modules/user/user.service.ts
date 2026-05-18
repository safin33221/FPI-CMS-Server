

const getAllUser = async (query: any) => {
    // implement logic here
}

const getSingleUser = async (userId: string) => {
    // implement logic here
}

const getMyProfile = async (userId: string) => {
    // implement logic here
}

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