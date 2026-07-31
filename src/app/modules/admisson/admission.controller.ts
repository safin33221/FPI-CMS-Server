import catchAsync from "../../utils/catchAsync.js";
import httpCode from "../../utils/httpStatus.js";
import sendResponse from "../../utils/sendResponse.js";
import { AdmissionServices } from "./admission.service.js";

const confirmAdmission = catchAsync(
    async (req, res) => {
        const { studentId } = req.params;

        const result =
            await AdmissionServices.confirmAdmission(
                studentId as string,
                req.user.id as string,
                req.body
            );

        sendResponse(res, {
            success: true,
            status: httpCode.OK,
            message: "Admission confirmed successfully.",
            data: result,
        });
    }
);

export const AdmissionControllers = {
    confirmAdmission,
};