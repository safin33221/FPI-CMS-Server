import { unlink } from 'node:fs/promises';
import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import { StudentService } from './student.service.js';

const toRequiredString = (value: unknown) => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (typeof normalizedValue !== 'string' && typeof normalizedValue !== 'number') {
    return undefined;
  }

  const str = String(normalizedValue).trim();
  return str.length > 0 ? str : undefined;
};

const importStudents = catchAsync(async (req: Request, res: Response) => {
  if (!req.file?.path) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  try {
    const result = await StudentService.importStudentsFromFile(req.file.path);

    return res.status(200).json({
      success: true,
      message: 'Students imported successfully',
      data: result,
    });
  } finally {
    await unlink(req.file.path).catch(() => undefined);
  }
});

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

  const result = await StudentService.verifyStudent({ roll, registrationNo, dob, phone });

  return res.status(200).json({
    success: true,
    message: 'Student verified successfully',
    data: result,
  });
});

export const StudentController = {
  importStudents,
  verifyStudent,
};
