
import httpStatus from "http-status";

import httpCode from "../utils/httpStatus.js";
import type { NextFunction, Request, Response } from "express";
import ApiError from "../error/ApiError.js";


const notFound = (req: Request, _res: Response, next: NextFunction) => {
    next(
        new ApiError(
            httpCode.NOT_FOUND,
            `Route not found: ${req.originalUrl}`
        )
    );
};

export default notFound;
