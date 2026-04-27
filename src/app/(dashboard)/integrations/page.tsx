"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Store, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  Unlink, 
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface IntegrationStatus {
  platform: string;
  storeName: string;
  lastSync: string | null;
  createdAt: string;
}

interface StatusResponse {
  tiendanube: IntegrationStatus | null;
  shopify: IntegrationStatus | null;
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/integrations/status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectTiendanube = async () => {
    setActionLoading("tiendanube_connect");
    try {
      const res = await fetch("/api/auth/tiendanube");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Error connecting Tiendanube:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncTiendanube = async () => {
    setActionLoading("tiendanube_sync");
    try {
      await fetch("/api/integrations/tiendanube/sync", { method: "POST" });
      fetchStatus();
    } catch (error) {
      console.error("Error syncing Tiendanube:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectTiendanube = async () => {
    setActionLoading("tiendanube_disconnect");
    try {
      const res = await fetch("/api/integrations/tiendanube/disconnect", { method: "POST" });
      if (res.ok) {
        fetchStatus();
      }
    } catch (error) {
      console.error("Error disconnecting Tiendanube:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-neon-cyan animate-spin" />
        <p className="text-[var(--text-secondary)] animate-pulse">Cargando integraciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Integraciones
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Conecta tus tiendas para sincronizar pedidos, generar rótulos de envío y automatizar tu logística.
        </p>
      </div>

      {connected && (
        <div className="flex items-center gap-3 rounded-xl border border-neon-green/30 bg-neon-green/5 p-4 text-neon-green animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">¡Tienda conectada exitosamente!</p>
        </div>
      )}

      {errorParam && (
        <div className="flex items-center gap-3 rounded-xl border border-neon-red/30 bg-neon-red/5 p-4 text-neon-red animate-in zoom-in-95 duration-300">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">
            {errorParam === "token_failed" ? "Error al obtener el token de acceso." : "Ocurrió un error inesperado al conectar."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tiendanube Card */}
        <Card glow="cyan" className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
              <ShoppingBag className="h-8 w-8 text-neon-cyan" />
            </div>
            {status?.tiendanube ? (
              <Badge variant="green" className="flex items-center gap-1.5 px-2.5 py-0.5">
                <CheckCircle2 className="h-3 w-3" /> Conectado
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1.5 px-2.5 py-0.5 opacity-70">
                <XCircle className="h-3 w-3" /> No conectado
              </Badge>
            )}
          </div>

          <div className="space-y-2 mb-8 flex-1">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Tiendanube</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Sincroniza tus pedidos de Tiendanube automáticamente y gestiona tus envíos de forma masiva.
            </p>
          </div>

          {status?.tiendanube ? (
            <div className="space-y-4 pt-4 border-t border-brand-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium">Tienda</span>
                <span className="text-[var(--text-primary)] font-semibold">{status.tiendanube.storeName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium">Última Sincro</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {status.tiendanube.lastSync 
                    ? new Date(status.tiendanube.lastSync).toLocaleString("es-AR")
                    : "Nunca"}
                </span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleSyncTiendanube}
                  disabled={actionLoading === "tiendanube_sync"}
                >
                  {actionLoading === "tiendanube_sync" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3.5 w-3.5" />
                  )}
                  {actionLoading === "tiendanube_sync" ? "Sincronizando..." : "Sincronizar pedidos"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => window.location.href = "/tiendanube"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Pedidos
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleDisconnectTiendanube}
                    disabled={actionLoading === "tiendanube_disconnect"}
                  >
                    {actionLoading === "tiendanube_disconnect" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unlink className="h-3.5 w-3.5" />
                    )}
                    Desconectar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 mt-auto">
              <Button 
                className="w-full gap-2" 
                onClick={handleConnectTiendanube}
                disabled={actionLoading === "tiendanube_connect"}
              >
                {actionLoading === "tiendanube_connect" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Conectar Tiendanube
              </Button>
            </div>
          )}
        </Card>

        {/* Shopify Card (Próximamente) */}
        <Card glow="purple" className="flex flex-col h-full opacity-80">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
              <Store className="h-8 w-8 text-neon-purple" />
            </div>
            <Badge variant="default" className="px-2.5 py-0.5">Próximamente</Badge>
          </div>

          <div className="space-y-2 mb-8 flex-1">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Shopify</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Integra tu tienda Shopify para importar tus pedidos y optimizar tus tiempos de entrega.
            </p>
          </div>

          <div className="pt-4 mt-auto">
            <Button disabled className="w-full gap-2 variant-secondary opacity-50">
              Conectar Shopify
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
