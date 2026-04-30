import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { randomUUID } from "crypto";

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.role !== "SUPERADMIN") return null;
  return session.user;
}

export async function createAuditLog(params: {
  actorId:    string;
  actorRole:  string;
  action:     string;
  entityType?: string;
  entityId?:   string;
  oldValue?:   unknown;
  newValue?:   unknown;
  reason?:     string;
  ipAddress?:  string;
}) {
  await prisma.auditLog.create({
    data: {
      id:         randomUUID(),
      actorId:    params.actorId,
      actorRole:  params.actorRole,
      action:     params.action,
      entityType: params.entityType ?? null,
      entityId:   params.entityId ?? null,
      oldValue:   params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null,
      newValue:   params.newValue !== undefined ? JSON.stringify(params.newValue) : null,
      reason:     params.reason ?? null,
      ipAddress:  params.ipAddress ?? null,
    },
  }).catch((e) => console.error("[AUDIT_LOG_ERROR]", e));
}

export function periodToDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "7d": {
      const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "30d": {
      const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "prev-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end: e };
    }
    case "this-month":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
  }
}
