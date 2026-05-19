import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Re-export constants so existing API route imports keep working
export {
  OPERATIONAL_STATUSES,
  STATUS_LABELS,
  STATUS_CLIENT_MESSAGES,
  STATUS_COLORS,
} from "./admin-constants";
export type { OperationalStatus } from "./admin-constants";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (!["ADMIN", "SUPERADMIN", "STAFF"].includes(session.user.role ?? "")) return null;
  return session.user;
}
