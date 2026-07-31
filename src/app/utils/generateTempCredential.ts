import { Prisma, Role } from "@prisma/client";

type LoginIdCategory = "STAFF" | "STUDENT";

const LOGIN_ID_CONFIG: Record<
  LoginIdCategory,
  {
    roles: Role[];
    startFrom: number;
    passwordPrefix: string;
  }
> = {
  STAFF: {
    roles: [
      "PRINCIPAL",
      "ADMIN",
      "REGISTRAR",
      "ACCOUNTANT",
      "TEACHER",
      "DEPARTMENT_HEAD",
      "EXAM_CONTROLLER",
    ],
    startFrom: 1001,
    passwordPrefix: "FPI",
  },

  STUDENT: {
    roles: ["STUDENT"],
    startFrom: 2500001,
    passwordPrefix: "FPI",
  },
};

export const generateLoginCredentials = async (
  tx: Prisma.TransactionClient,
  category: LoginIdCategory
) => {
  const config = LOGIN_ID_CONFIG[category];

  const lastUser = await tx.user.findFirst({
    where: {
      role: {
        in: config.roles,
      },
    },
    orderBy: {
      loginId: "desc",
    },
    select: {
      loginId: true,
    },
  });

  const loginId = lastUser
    ? (Number(lastUser.loginId) + 1).toString()
    : config.startFrom.toString();

  const tempPassword = `${config.passwordPrefix}@${loginId}`;

  return {
    loginId,
    tempPassword,
  };
};