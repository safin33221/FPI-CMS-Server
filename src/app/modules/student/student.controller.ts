import { unlink } from 'node:fs/promises';
import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import { StudentService } from './student.service.js';
import sendResponse from '../../utils/sendResponse.js';
import httpCode from '../../utils/httpStatus.js';

const toRequiredString = (value: unknown) => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (typeof normalizedValue !== 'string' && typeof normalizedValue !== 'number') {
    return undefined;
  }

  const str = String(normalizedValue).trim();
  return str.length > 0 ? str : undefined;
};

const getAllStudent = catchAsync(
  async (req, res) => {
    const result =
      await StudentService.getAllStudent(
        req.query
      );

    sendResponse(res, {
      status: httpCode.OK,
      success: true,
      message:
        "Students retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);


const verifyStudent = catchAsync(async (req: Request, res: Response) => {
  const roll = toRequiredString(req.body.roll ?? req.query.roll);
  const registrationNo = toRequiredString(req.body.registrationNo ?? req.query.registrationNo);
  const dob = toRequiredString(req.body.dob ?? req.query.dob);
  const phone = toRequiredString(req.body.phone ?? req.query.phone);

  if (!roll || !registrationNo || !dob || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: roll, registrationNo, dob, phone',
    });
  }

  const result = await StudentService.verifyStudent({ roll, registrationNo, phone });


  sendResponse(res, {
    status: httpCode.OK,
    success: true,
    message: "Student Data verified",
    data: result

  })
});

export const StudentController = {
  getAllStudent,
  verifyStudent,
};
