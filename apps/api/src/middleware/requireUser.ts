import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

const ALLOWED_AUTH_MODES = ["header", "clerk"] as const;
type AuthMode = (typeof ALLOWED_AUTH_MODES)[number];

function resolveAuthMode(): AuthMode {
  const mode = (process.env.AUTH_MODE ?? "header").toLowerCase();
  return (ALLOWED_AUTH_MODES as readonly string[]).includes(mode) ? (mode as AuthMode) : "header";
}

export const AUTH_MODE = resolveAuthMode();

export const MISSING_USER_ID_ERROR = {
  error: "Missing x-user-id header",
};

export const MISSING_TOKEN_ERROR = {
  error: "Missing or invalid authentication token",
};

export const requireUser: RequestHandler = (req, res, next) => {
  if (AUTH_MODE === "clerk") {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json(MISSING_TOKEN_ERROR);
    }

    res.locals.userId = userId;
    return next();
  }

  const userId = req.header("x-user-id")?.trim();

  if (!userId) {
    return res.status(401).json(MISSING_USER_ID_ERROR);
  }

  res.locals.userId = userId;
  return next();
};
