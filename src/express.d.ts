import { PrismaClient, Subscription } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";



declare global {
    namespace Express {
        interface Request {
            user: JwtPayload & {
                id: string;
                role: string;
                systemRole: string
            };


        }
    }
}

export { };