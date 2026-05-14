// src/services/studentImport.service.ts
import xlsx from 'xlsx';
import { prisma } from '../../../lib/prisma.js';

type RawStudentRow = Record<string, unknown>;

type StudentImportPayload = {
  roll: string | undefined;
  registrationNo: string | undefined;
  name: string | undefined;
  phone: string | undefined;
  session: string | undefined;
  batch: string | undefined;
  departmentCode: string | undefined;
  semesterNumber: number | undefined;
};

type StudentImportError = {
  row: number;
  error: string;
  data: RawStudentRow;
};

type DepartmentLookup = {
  id: string;
  code: string;
  name: string;
};

type SemesterLookup = {
  id: string;
  number: number;
};

// Helper: get first non-empty value from possible keys
const getCellValue = (row: RawStudentRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const toOptionalString = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
};

const toOptionalNumber = (value: unknown) => {
  const str = toOptionalString(value);
  if (!str) return undefined;
  const num = Number(str);
  return isNaN(num) ? undefined : num;
};

const toSemesterNumber = (value: unknown) => {
  const directNumber = toOptionalNumber(value);
  if (directNumber !== undefined) return directNumber;

  const str = toOptionalString(value);
  if (!str) return undefined;

  const match = str.match(/\d+/);
  if (!match?.[0]) return undefined;

  const num = Number(match[0]);
  return isNaN(num) ? undefined : num;
};

const normalizeLookupValue = (value: string) => value.trim().toUpperCase();

const createDepartmentCode = (value: string) =>
  normalizeLookupValue(value)
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getOrdinalSuffix = (value: number) => {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return 'th';

  switch (value % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const formatSemesterName = (value: number) => `${value}${getOrdinalSuffix(value)}`;

const getMissingRequiredFields = (payload: StudentImportPayload) => {
  const missingFields: string[] = [];

  if (!payload.roll) missingFields.push('roll');
  if (!payload.registrationNo) missingFields.push('registrationNo');
  if (!payload.name) missingFields.push('name');
  if (!payload.departmentCode) missingFields.push('departmentCode');
  if (payload.semesterNumber === undefined) missingFields.push('semesterNumber');

  return missingFields;
};

// Convert Excel serial date (days since 1900-01-01) to JS Date
const excelSerialToDate = (serial: number): Date => {
  const utcDays = serial - 25569; // Excel epoch → Unix epoch
  const ms = utcDays * 86400 * 1000;
  const date = new Date(ms);
  // Fix timezone offset: use UTC date components
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const parseDate = (value: unknown): Date | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') {
    const date = excelSerialToDate(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  const str = String(value).trim();
  if (!str) return undefined;
  const date = new Date(str);
  return isNaN(date.getTime()) ? undefined : date;
};

const getDateOnlyRange = (value: Date | string) => {
  const date = parseDate(value);

  if (!date) {
    throw new Error('Invalid date of birth. Expected a valid date like YYYY-MM-DD.');
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
};

const getStudentPayloadFromRow = (row: RawStudentRow): StudentImportPayload => {
  return {
    roll: toOptionalString(getCellValue(row, ['roll', 'Roll'])),
    registrationNo: toOptionalString(
      getCellValue(row, ['registrationNo', 'registration_no', 'regNo', 'RegistrationNo']),
    ),
    name: toOptionalString(getCellValue(row, ['name', 'Name'])),
    phone: toOptionalString(getCellValue(row, ['phone', 'Phone'])),
    session: toOptionalString(getCellValue(row, ['session', 'Session'])),
    batch: toOptionalString(getCellValue(row, ['batch', 'Batch'])),
    departmentCode: toOptionalString(
      getCellValue(row, [
        'departmentCode',
        'department_code',
        'department',
        'DepartmentCode',
        'Department',
      ]),
    ),
    semesterNumber: toSemesterNumber(
      getCellValue(row, [
        'semesterNumber',
        'semester_number',
        'semester',
        'SemesterNumber',
        'Semester',
      ]),
    ),
  };
};


const importStudentsFromFile = async (filePath: string) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No worksheet found in uploaded file');

  const sheet = workbook.Sheets[sheetName]!;
  const rows = xlsx.utils.sheet_to_json<RawStudentRow>(sheet, { defval: '' });

  const [departments, semesters] = await Promise.all([
    prisma.department.findMany({ select: { id: true, code: true, name: true } }),
    prisma.semester.findMany({ select: { id: true, number: true } }),
  ]);

  const departmentMap = new Map<string, string>();
  departments.forEach((department: DepartmentLookup) => {
    departmentMap.set(normalizeLookupValue(department.code), department.id);
    departmentMap.set(normalizeLookupValue(department.name), department.id);
  });
  const semesterMap = new Map(semesters.map((s: SemesterLookup) => [s.number, s.id]));

  let importedCount = 0;
  const errors: StudentImportError[] = [];

  for (const [index, row] of rows.entries()) {
    const payload = getStudentPayloadFromRow(row);
    const rowNumber = index + 2;
    const missingFields = getMissingRequiredFields(payload);

    // Required fields check
    if (missingFields.length > 0) {
      errors.push({
        row: rowNumber,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        data: row,
      });
      continue;
    }

    const roll = payload.roll!;
    const registrationNo = payload.registrationNo!;
    const name = payload.name!;
    const departmentCode = payload.departmentCode!;
    const semesterNumber = payload.semesterNumber!;

    let departmentId = departmentMap.get(normalizeLookupValue(departmentCode));
    let semesterId = semesterMap.get(semesterNumber);

    if (!departmentId) {
      const createdDepartment = await prisma.department.create({
        data: {
          name: departmentCode,
          code: createDepartmentCode(departmentCode),
        },
      });
      departmentId = createdDepartment.id;
      departmentMap.set(normalizeLookupValue(createdDepartment.code), createdDepartment.id);
      departmentMap.set(normalizeLookupValue(createdDepartment.name), createdDepartment.id);
    }
    if (!semesterId) {
      const createdSemester = await prisma.semester.create({
        data: {
          name: formatSemesterName(semesterNumber),
          number: semesterNumber,
        },
      });
      semesterId = createdSemester.id;
      semesterMap.set(createdSemester.number, createdSemester.id);
    }

    // Optional fields
    const phone = payload.phone;
    const dob = parseDate(row['dob'] ?? row['DateOfBirth']);
    const session = payload.session;
    const batch = payload.batch;

    try {
      // Build update data object without undefined values
      const updateData: any = {
        registrationNo,
        name,
        departmentId,
        semesterId,
      };
      if (phone !== undefined) updateData.phone = phone;
      if (dob !== undefined) updateData.dob = dob;
      if (session !== undefined) updateData.session = session;
      if (batch !== undefined) updateData.batch = batch;

      // Build create data object (similar, no userId)
      const createData: any = {
        roll,
        registrationNo,
        name,
        departmentId,
        semesterId,
      };
      if (phone !== undefined) createData.phone = phone;
      if (dob !== undefined) createData.dob = dob;
      if (session !== undefined) createData.session = session;
      if (batch !== undefined) createData.batch = batch;

      await prisma.student.upsert({
        where: { roll },
        update: updateData,
        create: createData,
      });
      importedCount++;
    } catch (error) {
      errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : 'Failed to import student',
        data: row,
      });
    }
  }

  return { importedCount, errors };
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
    throw new Error("No matching student found. Please check your credentials.");
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
  importStudentsFromFile,
  verifyStudent,
};
