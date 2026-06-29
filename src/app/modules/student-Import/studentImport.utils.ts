
import { EXCEL_KEYS } from "./studentImport.constants.js";
import type { ParsedStudentRow, RawExcelRow } from "./studentImport.types.js";

export const getValue = (
    row: RawExcelRow,
    keys: string[]
) => {
    for (const key of keys) {
        const value = row[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return undefined;
};

export const toString = (
    value: unknown
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
};

export const toNumber = (
    value: unknown
) => {
    const number = Number(
        toString(value)
    );

    return isNaN(number)
        ? 0
        : number;
};

export const normalize = (
    value: string
) =>
    value
        .trim()
        .toUpperCase();

export const mapExcelRow = (
    row: RawExcelRow
): ParsedStudentRow => ({


    fullName: toString(
        getValue(row, EXCEL_KEYS.fullName)
    ),

    roll: toString(
        getValue(row, EXCEL_KEYS.roll)
    ),

    registrationNo: toString(
        getValue(
            row,
            EXCEL_KEYS.registrationNo
        )
    ),

    phone: toString(
        getValue(
            row,
            EXCEL_KEYS.phone
        )
    ),

    gender: toString(
        getValue(
            row,
            EXCEL_KEYS.gender
        )
    ),

    departmentCode: toString(
        getValue(
            row,
            EXCEL_KEYS.departmentCode
        )
    ),

    semesterNumber: toNumber(
        getValue(
            row,
            EXCEL_KEYS.semester
        )
    ),

    session: toString(
        getValue(
            row,
            EXCEL_KEYS.session
        )
    ),
});