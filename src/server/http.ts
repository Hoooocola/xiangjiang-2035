import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { DomainError } from "./errors";
import { logServerError } from "./logger";

export function jsonData(data: unknown, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function handleRouteError(error: unknown) {
  const traceId = randomUUID();

  if (error instanceof DomainError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
          traceId,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "请求数据不符合要求",
          fieldErrors: error.flatten().fieldErrors,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  logServerError("route.unhandled_error", error, { traceId });
  return Response.json(
    {
      error: {
        code: "CONFLICT",
        message: "服务器暂时无法完成该操作",
        traceId,
      },
    },
    { status: 500 },
  );
}
