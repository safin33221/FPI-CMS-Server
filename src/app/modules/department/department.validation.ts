// department.validation.ts

import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name is required"),

  code: z
    .string()
    .min(2, "Department code is required")
    .max(20),

  headId: z.string().optional(),
});

export type CreateDepartmentInput =
  z.infer<typeof createDepartmentSchema>;