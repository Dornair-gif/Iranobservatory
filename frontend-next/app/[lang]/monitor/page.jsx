import { isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MonitorDashboard } from "@/components/MonitorDashboard";
import { notFound } from "next/navigation";

// Iran Monitor page — server component shell, dashboard inside is client
// (interactive: auto-refresh every 10min, sparklines, live "X min ago" pill).

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  return {
    title: lang === "fr"
      ? "Iran Monitor — Tableau de bord temps réel"
      : lang === "fa"
      ? "ایران مانیتور — داشبورد لحظه‌ای"
      : "Iran Monitor — Real-time intelligence dashboard",
    description: lang === "fr"
      ? "Tableau de bord temps réel sur l'Iran : indice de tension, crise du détroit d'Ormuz, sanctions, blackouts internet, droits humains. Sources vérifiées : NetBlocks, HRA, OFAC, UNSCR."
      : lang === "fa"
      ? "داشبورد لحظه‌ای ایران: شاخص تنش، بحران تنگه هرمز، تحریم‌ها، قطعی اینترنت، حقوق بشر."
      : "Real-time intelligence dashboard on Iran: tension index, Strait of Hormuz crisis, sanctions tracker, internet blackouts, human rights. Verified sources.",
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/monitor`,
      languages: {
        "fr-FR": "https://iranobservatory.org/fr/monitor",
        "en-US": "https://iranobservatory.org/en/monitor",
        "fa-IR": "https://iranobservatory.org/fa/monitor",
      },
    },
  };
}

export default async function MonitorPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  return (
    <>
      <Header lang={lang} />
      <MonitorDashboard lang={lang} />
      <Footer lang={lang} />
    </>
  );
}
