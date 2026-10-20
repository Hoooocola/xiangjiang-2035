import { sql } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { DomainError } from "./errors";

export async function requireCurrentUser(request: Request, db: AppDatabase) {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_AUTH !== "true") {
    throw new DomainError(
      "UNAUTHENTICATED",
      "生产认证尚未接入；开发认证仅能在非生产环境显式启用",
      401,
    );
  }

  const email = request.headers.get("x-dev-user-email") ?? process.env.DEV_AUTH_USER_EMAIL;
  if (!email) {
    throw new DomainError("UNAUTHENTICATED", "缺少开发用户身份", 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  if (!user || user.status !== "Active") {
    throw new DomainError("UNAUTHENTICATED", "当前开发用户不存在或不可用", 401);
  }
  return user;
}
