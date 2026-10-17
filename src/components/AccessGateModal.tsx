import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  LogOut,
  Sparkles,
  Zap,
  TrendingUp,
  X,
} from "lucide-react";
import { AccessSession } from "../types";
import { soundManager } from "../utils/soundEffects";
import confetti from "canvas-confetti";

interface AccessGateModalProps {
  isOpen: boolean;
  currentSession: AccessSession | null;
  onAccessGranted: (session: AccessSession) => void;
  onLogout: () => void;
  canClose?: boolean;
  onClose?: () => void;
}

export const AccessGateModal: React.FC<AccessGateModalProps> = ({
  isOpen,
  currentSession,
  onAccessGranted,
  onLogout,
  canClose = false,
  onClose,
}) => {
  const [email, setEmail] = useState<string>(currentSession?.email || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [resultState, setResultState] = useState<"IDLE" | "SUCCESS" | "DENIED" | "ERROR">("IDLE");
  const [message, setMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setResultState("ERROR");
      setMessage("Por favor, informe um endereço de e-mail válido.");
      soundManager.playLossChime();
      return;
    }

    setLoading(true);
    setResultState("IDLE");
    setMessage("");

    try {
      const response = await fetch("/api/auth/access-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (data.access === true) {
        setResultState("SUCCESS");
        setMessage("Acesso VIP Liberado! Bem-vindo ao CandleX AI.");
        soundManager.playGoalReached();
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        const newSession: AccessSession = {
          email: cleanEmail,
          isAuthorized: true,
          validatedAt: Date.now(),
        };

        localStorage.setItem("candlex_access_session", JSON.stringify(newSession));

        setTimeout(() => {
          onAccessGranted(newSession);
          if (onClose) onClose();
        }, 1500);
      } else {
        setResultState("DENIED");
        setMessage(
          data.message ||
            "Acesso não liberado. Certifique-se de que se cadastrou pelo link oficial e realizou o primeiro depósito na Hiove."
        );
        soundManager.playLossChime();
      }
    } catch (err: any) {
      console.error("Erro ao validar acesso:", err);
      setResultState("ERROR");
      setMessage("Erro ao comunicar com o servidor de validação. Verifique sua conexão e tente novamente.");
      soundManager.playLossChime();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0E121B] border border-[#1E2638] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7A00] via-[#00E676] to-[#FF7A00]" />

        {/* Top bar modal */}
        <div className="px-6 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A00]/20 to-[#00E676]/20 border border-[#FF7A00]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,0,0.2)]">
              {currentSession?.isAuthorized ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-[#FF7A00]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  PORTAL DE ACESSO CANDLEX AI
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30 font-bold">
                  HIOVE VIP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Validação oficial de clientes cadastrados e ativos
              </p>
            </div>
          </div>

          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active Session Info (if already authorized) */}
          {currentSession?.isAuthorized && resultState === "IDLE" ? (
            <div className="bg-[#141A26] border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Sessão Ativa & Habilitada</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  STATUS VIP
                </span>
              </div>

              <div className="text-xs text-slate-300">
                E-mail autenticado:{" "}
                <span className="font-mono text-white font-bold">{currentSession.email}</span>
              </div>

              <div className="text-[11px] text-slate-400">
                Validado em: {new Date(currentSession.validatedAt).toLocaleString("pt-BR")}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => handleValidate()}
                  disabled={loading}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#1E2638] hover:bg-[#2A364F] text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Revalidar Status
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="py-2 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Teaser Perks Banner */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[#121622] border border-[#1E2638] text-center">
                  <Zap className="w-4 h-4 text-[#FF7A00] mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-200 block">Sinais M1 & M5</span>
                  <span className="text-[9px] text-slate-400">Gatilhos Hiove</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121622] border border-[#1E2638] text-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-200 block">IA SMC Neural</span>
                  <span className="text-[9px] text-slate-400">Order Flow Real</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121622] border border-[#1E2638] text-center">
                  <Sparkles className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-200 block">Vision Scanner</span>
                  <span className="text-[9px] text-slate-400">Análise de Print</span>
                </div>
              </div>

              {/* Requirements Explanatory Card */}
              <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
                  Requisitos para Liberação de Acesso:
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5 pl-5 list-disc">
                  <li>
                    Ter cadastro na corretora <strong className="text-white">Hiove</strong> realizado pelo nosso link de indicação.
                  </li>
                  <li>
                    Já ter realizado pelo menos o <strong className="text-emerald-400">primeiro depósito</strong> na conta da corretora.
                  </li>
                </ul>
              </div>

              {/* Form Input */}
              <form onSubmit={handleValidate} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>E-mail cadastrado na Hiove</span>
                    <span className="text-[10px] text-slate-400 lowercase">ex: seu@email.com</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="digite seu e-mail da corretora Hiove..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#090C12] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner font-mono"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF8C00] via-[#FF7A00] to-[#E65100] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,122,0,0.35)] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Validando junto à API Hiove...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar Acesso & Entrar</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Feedback states */}
          {resultState === "SUCCESS" && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <strong className="block text-white font-bold">{message}</strong>
                <span>Carregando sua estação de inteligência artificial...</span>
              </div>
            </div>
          )}

          {resultState === "DENIED" && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-white font-bold text-sm">
                    Acesso Não Liberado
                  </strong>
                  <p className="text-slate-300 leading-relaxed">{message}</p>
                </div>
              </div>

              {/* Instructions to unlock */}
              <div className="bg-[#090C12] p-3 rounded-lg border border-rose-500/20 space-y-2">
                <div className="text-[11px] font-bold text-slate-200">
                  Como desbloquear o CandleX AI agora:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.open("https://app.hiove.com/register", "_blank")}
                    className="py-2 px-3 rounded-lg bg-[#FF7A00] hover:bg-[#FFA022] text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>1. Criar Conta na Hiove</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidate()}
                    className="py-2 px-3 rounded-lg bg-[#1E2638] hover:bg-[#2A364F] text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>2. Já Depositei, Tentar Novamente</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {resultState === "ERROR" && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Footer note */}
          <div className="text-center text-[10.5px] text-slate-500 pt-2 border-t border-[#1E2638]">
            Validação automatizada via Hiove Access API • Criptografia de ponta a ponta
          </div>
        </div>
      </div>
    </div>
  );
};
