import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminClientProvider } from "@/contexts/admin-client";
import { ClientSelectorBar } from "@/components/admin/client-selector-bar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/dashboard");

  return (
    <AdminClientProvider>
      <div className="min-h-screen bg-[#0c0a07] flex">
        <AdminSidebar session={session} />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto flex flex-col">
          <ClientSelectorBar />
          <div className="p-8 flex-1">{children}</div>
        </main>
      </div>
    </AdminClientProvider>
  );
}
