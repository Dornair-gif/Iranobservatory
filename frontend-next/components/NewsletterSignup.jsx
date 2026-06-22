"use client";

import { useState } from "react";

// Newsletter signup form — client component because of <form> + state.
// POSTs to /api/subscribers (proxied to backend by next.config.mjs rewrite).

export function NewsletterSignup({ lang }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const copy = {
    fr: {
      title: "Restez informé",
      blurb:
        "Recevez notre brief hebdomadaire et les articles clés directement dans votre boîte mail.",
      placeholder: "Votre email",
      submit: "S'inscrire",
      success: "Inscription confirmée !",
      error: "Erreur, veuillez réessayer.",
      legal: "Pas de spam. Désinscription à tout moment.",
    },
    en: {
      title: "Stay Informed",
      blurb:
        "Get our weekly intelligence brief and featured articles delivered to your inbox.",
      placeholder: "Your email address",
      submit: "Subscribe",
      success: "You're subscribed!",
      error: "Error, please try again.",
      legal: "No spam. Unsubscribe anytime.",
    },
    fa: {
      title: "مطلع بمانید",
      blurb: "گزارش هفتگی و مقالات کلیدی ما را در صندوق ورودی خود دریافت کنید.",
      placeholder: "ایمیل شما",
      submit: "عضویت",
      success: "عضویت تأیید شد!",
      error: "خطا، لطفاً دوباره تلاش کنید.",
      legal: "بدون اسپم. در هر زمان لغو عضویت.",
    },
  }[lang] || {};

  async function submit(e) {
    e.preventDefault();
    if (!email.includes("@")) return;
    try {
      const r = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newsletter: true, language: lang }),
      });
      if (r.ok || r.status === 409) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-[#f8f9fb] border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-heading font-bold text-2xl text-[#1E3A5F] tracking-tight mb-2">
            {copy.title}
          </h3>
          <p className="text-sm text-zinc-500 mb-5">{copy.blurb}</p>
          {status === "success" ? (
            <p className="text-[#3DB883] font-mono text-sm py-3" data-testid="newsletter-success">
              ✓ {copy.success}
            </p>
          ) : (
            <form
              onSubmit={submit}
              className="flex gap-2 max-w-md mx-auto"
              data-testid="newsletter-form"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.placeholder}
                required
                className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                data-testid="newsletter-email"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#1E3A5F] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2a4d75] transition-colors rounded-lg"
                data-testid="newsletter-submit"
              >
                {copy.submit}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-red-500 text-xs mt-2">{copy.error}</p>
          )}
          <p className="text-[10px] text-zinc-400 mt-3">{copy.legal}</p>
        </div>
      </div>
    </div>
  );
}
