import { prisma } from "./prisma";
import { randomUUID } from "crypto";

export async function deductCredits(
  userId: string,
  amount: number,
  description: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.credits < amount) {
    throw new Error("Créditos insuficientes");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    }),
    prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        type: "debit",
        amount,
        description,
      },
    }),
  ]);

  return user.credits - amount;
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  reference?: string
) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        type: "credit",
        amount,
        description,
        reference,
      },
    }),
  ]);
}

export const CREDIT_PRICES = {
  50: 5000,
  100: 9000,
  200: 16000,
} as const;

export const CREDIT_COSTS = {
  EXPORT_LABEL: 1,
  SEND_NOTIFICATION: 0.5,
} as const;
