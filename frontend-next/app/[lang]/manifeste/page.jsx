import { isValidLang, LANG_META, LANGUAGES } from "@/lib/i18n";
import { MANIFESTO } from "@/lib/editorial/manifesto";
import { EditorialPage } from "@/components/EditorialPage";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export const dynamic = "force-static";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const c = MANIFESTO[lang] || MANIFESTO.fr;
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/manifeste`,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [LANG_META[l].htmlLang, `https://iranobservatory.org/${l}/manifeste`])
      ),
    },
    openGraph: {
      title: c.seoTitle,
      description: c.seoDescription,
      url: `https://iranobservatory.org/${lang}/manifeste`,
      type: "article",
      locale: LANG_META[lang].htmlLang,
      publishedTime: "2026-05-01",
    },
  };
}

export default async function ManifestoPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const c = MANIFESTO[lang] || MANIFESTO.fr;

  const breadcrumbs = [
    { name: lang === "fa" ? "خانه" : lang === "en" ? "Home" : "Accueil", path: `/${lang}` },
    { name: c.breadcrumbName, path: `/${lang}/manifeste` },
  ];

  // OpinionNewsArticle JSON-LD — authored by the Organization itself
  // (editorial board) since the founder name is not publicly attributed.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OpinionNewsArticle",
    headline: c.title,
    description: c.seoDescription,
    inLanguage: LANG_META[lang].htmlLang,
    url: `https://iranobservatory.org/${lang}/manifeste`,
    datePublished: "2026-05-01",
    author: {
      "@type": "Organization",
      name: "Iran Observatory · Decrypt & Intel",
      url: "https://iranobservatory.org",
    },
    publisher: {
      "@type": "Organization",
      name: "Iran Observatory · Decrypt & Intel",
      url: "https://iranobservatory.org",
      logo: {
        "@type": "ImageObject",
        url: "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png",
      },
    },
  };

  return (
    <EditorialPage
      lang={lang}
      label={c.label}
      title={c.title}
      subtitle={c.subtitle}
      signature={c.signature}
      breadcrumbs={breadcrumbs}
      jsonLd={jsonLd}
      voice="personal"
    >
      {c.body()}
    </EditorialPage>
  );
}
