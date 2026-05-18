import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const get = (key: string, fallback?: string): string => {
  const value = process.env[key];

  if (!value && fallback === undefined) {
    throw new Error(`Missing env: ${key}`);
  }

  return value ?? fallback!;
};

const num = (key: string, fallback?: number): number => {
  const value = process.env[key];

  if (!value) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env: ${key}`);
  }

  const parsed = Number(value);

  if (isNaN(parsed)) {
    throw new Error(`Env ${key} must be a number`);
  }

  return parsed;
};

export const envConfig = {
  NODE_ENV: get("NODE_ENV", "development"),

  PORT: num("PORT", 3000),

  JWT_ACCESS_SECRET: get(
    "JWT_ACCESS_SECRET",
    "default_secret_change_me"
  ),

  JWT_REFRESH_SECRET: get(
    "JWT_REFRESH_SECRET",
    "default_secret_change_me"
  ),

  // keep as string because JWT libraries accept values like 15m / 7d
  JWT_ACCESS_EXPIRES_IN: get(
    "JWT_ACCESS_EXPIRES_IN",
    "15m"
  ),

  JWT_REFRESH_EXPIRES_IN: get(
    "JWT_REFRESH_EXPIRES_IN",
    "7d"
  ),
};