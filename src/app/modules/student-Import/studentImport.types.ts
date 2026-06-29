import type { Department, Semester } from "@prisma/client";


export interface RawExcelRow {
    [key: string]: unknown;
}

export interface ParsedStudentRow {
    fullName: string;
    roll: string;
    registrationNo: string;
    phone: string;
    gender: string;
    departmentCode: string;
    semesterNumber: number;
    session: string;
}

export interface PreviewStudent {
    row: number;

    valid: boolean;

    data?: ParsedStudentRow;

    errors: string[];
}

export interface ImportPreviewResponse {
    totalRows: number;

    validRows: number;

    invalidRows: number;

    students: PreviewStudent[];
}

export interface DepartmentLookup
    extends Pick<Department, "id" | "code" | "name"> { }

export interface SemesterLookup
    extends Pick<Semester, "id" | "number" | "name"> { }