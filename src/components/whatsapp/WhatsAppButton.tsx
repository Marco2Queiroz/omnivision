"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

type Props = {
  /** Somente dígitos com DDI, ex: 5511999990000 */
  phoneE164Digits: string;
  message: string;
  label?: string;
};

export function WhatsAppButton({
  phoneE164Digits,
  message,
  label = "WhatsApp",
}: Props) {
  if (!phoneE164Digits.replace(/\D/g, "")) {
    return (
      <span className="text-[10px] uppercase text-outline">Sem contato</span>
    );
  }

  const href = buildWhatsAppUrl(phoneE164Digits, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-900/50"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
