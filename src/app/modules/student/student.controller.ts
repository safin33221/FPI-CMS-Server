import { unlink } from 'node:fs/promises';
import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import { StudentService } from './student.service.js';

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

export const StudentController = {
  importStudents,
};
