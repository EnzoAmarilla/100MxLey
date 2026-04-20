import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";

// Auth is handled by middleware.ts — this layout renders immediately,
// no client-side session check needed.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
      <WhatsAppButton />
    </div>
  );
}
