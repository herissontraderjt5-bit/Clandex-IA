import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { ClientRecord, AccessSession } from "../types";
import { soundManager } from "../utils/soundEffects";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLoginDirect: (session: AccessSession) => void;
}

const ADMIN_EMAIL = "herisson.trader.jt5@gmail.com";

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onAdminLoginDirect,
}) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [authKey, setAuthKey] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // New Client Form
  const [newEmail, setNewEmail] = useState<string>("");
  const [durationOption, setDurationOption] = useState<string>("30"); // days or 'lifetime'
  const [newNotes, setNewNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-authenticate if stored or if key verified
      const savedAdmin = localStorage.getItem("candlex_admin_authenticated");
      if (savedAdmin === "true") {
        setIsAuthenticated(true);
        fetchClients();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = authKey.trim().toLowerCase();
    if (clean === ADMIN_EMAIL.toLowerCase() || clean === "admin" || clean === "herisson") {
      setIsAuthenticated(true);
      localStorage.setItem("candlex_admin_authenticated", "true");
      setErrorMessage("");
      fetchClients();
      soundManager.playGoalReached();
    } else {
      setErrorMessage("Chave ou e-mail de Administrador inválido.");
      soundManager.playLossChime();
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Por favor informe um e-mail válido.");
      return;
    }

    let expiresAt: number | null = null;
    if (durationOption !== "lifetime") {
      const days = parseInt(durationOption, 10) || 30;
      expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          expiresAt,
          status: "ACTIVE",
          notes: newNotes.trim() || "Cadastrado manualmente pelo Administrador",
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
        setNewEmail("");
        setNewNotes("");
        soundManager.playOrderExecuted();
      }
    } catch (err) {
      console.error("Erro ao adicionar cliente:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDuration = async (email: string, daysToAdd: number | null) => {
    let expiresAt: number | null = null;
    if (daysToAdd !== null) {
      expiresAt = Date.now() + daysToAdd * 24 * 60 * 60 * 1000;
    }

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, expiresAt }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Erro ao atualizar validade:", err);
    }
  };

  const handleToggleStatus = async (email: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const handleDeleteClient = async (email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/clients/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
    }
  };

  const handleDirectAdminLogin = () => {
    const adminSession: AccessSession = {
      email: ADMIN_EMAIL,
      isAuthorized: true,
      isAdmin: true,
      expiresAt: null,
      validatedAt: Date.now(),
    };
    localStorage.setItem("candlex_access_session", JSON.stringify(adminSession));
    onAdminLoginDirect(adminSession);
    onClose();
  };

  const filteredClients = clients.filter((c) =>
    c.email.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#090C12] border border-[#2A364F] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#1E2638] bg-[#0E131F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A00]/20 to-amber-500/20 border border-[#FF7A00]/50 flex items-center justify-center">
              <Key className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  PAINEL ADMINISTRATIVO CANDLEX AI
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  MASTER CONTROL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gerenciamento de clientes, acessos autorizados e datas de expiração
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleDirectAdminLogin}
                className="py-1.5 px-3 rounded-lg bg-[#FF7A00] hover:bg-[#FFA022] text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <span>Entrar no Terminal como Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto w-full my-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#141A26] border border-[#2A364F] flex items-center justify-center mx-auto text-[#FF7A00]">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Autenticação do Administrador</h3>
              <p className="text-xs text-slate-400 mt-1">
                Insira o e-mail ou a chave mestre do administrador para acessar o painel de clientes.
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-3 pt-2">
              <input
                type="text"
                autoFocus
                placeholder="digite: herisson.trader.jt5@gmail.com"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none font-mono text-center"
              />

              {errorMessage && (
                <div className="text-xs text-rose-400 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#FF7A00] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all cursor-pointer"
              >
                Acessar Painel Master
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Total de Clientes</div>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {clients.length}
                </div>
              </div>

              <div className="bg-[#0E131F] border border-emerald-500/30 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-emerald-400 uppercase">Clientes Ativos</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {
                    clients.filter(
                      (c) =>
                        c.status === "ACTIVE" &&
                        (!c.expiresAt || c.expiresAt > Date.now())
                    ).length
                  }
                </div>
              </div>

              <div className="bg-[#0E131F] border border-rose-500/30 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-rose-400 uppercase">Expirados / Bloqueados</div>
                <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
                  {
                    clients.filter(
                      (c) =>
                        c.status === "BLOCKED" ||
                        (c.expiresAt && c.expiresAt <= Date.now())
                    ).length
                  }
                </div>
              </div>
            </div>

            {/* Add New Client Box */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Plus className="w-4 h-4 text-[#FF7A00]" />
                <span>Cadastrar ou Renovar Acesso Manualmente (Fora da Hiove)</span>
              </div>

              <form onSubmit={handleAddClient} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="email"
                    required
                    placeholder="e-mail do cliente..."
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <select
                    value={durationOption}
                    onChange={(e) => setDurationOption(e.target.value)}
                    className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono cursor-pointer"
                  >
                    <option value="7">+7 Dias (Teste)</option>
                    <option value="15">+15 Dias</option>
                    <option value="30">+30 Dias (1 Mês Padrão)</option>
                    <option value="60">+60 Dias (2 Meses)</option>
                    <option value="90">+90 Dias (3 Meses)</option>
                    <option value="365">+1 Ano</option>
                    <option value="lifetime">Vitalício (Sem Expiração)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newEmail.trim()}
                  className="py-2 px-3 rounded-xl bg-[#FF7A00] hover:bg-[#FFA022] text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Liberar Cliente"}
                </button>
              </form>
            </div>

            {/* Client Search and Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="buscar por e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#070A0F] border border-[#1E2638] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchClients}
                  className="p-2 rounded-xl bg-[#141A26] border border-[#1E2638] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Atualizar Lista"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Table */}
              <div className="border border-[#1E2638] rounded-2xl overflow-hidden bg-[#070A0F]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0E131F] text-slate-400 font-mono text-[10px] uppercase border-b border-[#1E2638]">
                      <tr>
                        <th className="py-2.5 px-4">Cliente / E-mail</th>
                        <th className="py-2.5 px-3">Origem</th>
                        <th className="py-2.5 px-3">Data de Expiração</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-4 text-right">Ações Rápidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182030] text-slate-200">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                            Nenhum cliente cadastrado no momento.
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((c) => {
                          const isExpired = c.expiresAt ? c.expiresAt <= Date.now() : false;
                          const isMaster = c.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                          return (
                            <tr key={c.email} className="hover:bg-[#0E131F]/50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <span>{c.email}</span>
                                  {isMaster && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-black">
                                      ADM
                                    </span>
                                  )}
                                </div>
                                {c.notes && (
                                  <div className="text-[10px] text-slate-500 font-sans font-normal">
                                    {c.notes}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141A26] border border-[#1E2638] text-slate-400">
                                  {c.registeredVia || "HIOVE"}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                {c.expiresAt === null ? (
                                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                    VITALÍCIO
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div
                                      className={`font-mono text-xs font-bold ${
                                        isExpired ? "text-rose-400" : "text-emerald-400"
                                      }`}
                                    >
                                      {new Date(c.expiresAt).toLocaleDateString("pt-BR")}
                                    </div>
                                    <div className="text-[9.5px] text-slate-500 font-mono">
                                      {isExpired
                                        ? "EXPIRADO"
                                        : `${Math.ceil(
                                            (c.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
                                          )} dias restantes`}
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    c.status === "ACTIVE" && !isExpired
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  }`}
                                >
                                  {c.status === "BLOCKED"
                                    ? "BLOQUEADO"
                                    : isExpired
                                    ? "EXPIRADO"
                                    : "ATIVO"}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick +30 Days */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDuration(c.email, 30)}
                                    className="py-1 px-2 rounded-md bg-[#141A26] hover:bg-[#1E2638] text-[10px] font-bold text-slate-300 transition-colors cursor-pointer border border-[#1E2638]"
                                    title="Renovar +30 Dias"
                                  >
                                    +30d
                                  </button>

                                  {/* Quick Lifetime */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDuration(c.email, null)}
                                    className="py-1 px-2 rounded-md bg-[#141A26] hover:bg-[#1E2638] text-[10px] font-bold text-amber-400 transition-colors cursor-pointer border border-[#1E2638]"
                                    title="Tornar Vitalício"
                                  >
                                    Vitalício
                                  </button>

                                  {/* Toggle Active / Block */}
                                  {!isMaster && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(c.email, c.status)}
                                        className={`p-1 rounded-md border text-[10px] transition-colors cursor-pointer ${
                                          c.status === "ACTIVE"
                                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        }`}
                                        title={c.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                                      >
                                        {c.status === "ACTIVE" ? (
                                          <UserX className="w-3.5 h-3.5" />
                                        ) : (
                                          <UserCheck className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClient(c.email)}
                                        className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                                        title="Excluir Registro"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
