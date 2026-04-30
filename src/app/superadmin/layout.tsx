import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminSidebar } from "@/components/superadmin/sidebar";

export const metadata = { title: "Superadmin — 100Mxley" };

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user)                      redirect("/login");
  if (session.user.role !== "SUPERADMIN")  redirect("/dashboard");

  return (
    <div className="min-h-screen bg-brand-bg">
      <SuperAdminSidebar />
      <div className="ml-64">
        <main className="p-6 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
