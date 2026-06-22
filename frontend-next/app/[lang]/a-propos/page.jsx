import { isValidLang, LANG_META, LANGUAGES } from "@/lib/i18n";
import { ABOUT } from "@/lib/editorial/about";
import { EditorialPage } from "@/components/EditorialPage";
import { notFound } from "next/navigation";

// /a-propos — About page. Statically generated for all 3 languages.
// Used by Google E-E-A-T to establish "About Us" trust signals.

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export const dynamic = "force-static";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const c = ABOUT[lang] || ABOUT.fr;
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/a-propos`,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [LANG_META[l].htmlLang, `https://iranobservatory.org/${l}/a-propos`])
      ),
    },
    openGraph: {
      title: c.seoTitle,
      description: c.seoDescription,
      url: `https://iranobservatory.org/${lang}/a-propos`,
      type: "website",
      locale: LANG_META[lang].htmlLang,
    },
  };
}

export default async function AboutPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const c = ABOUT[lang] || ABOUT.fr;

  const breadcrumbs = [
    { name: lang === "fa" ? "خانه" : lang === "en" ? "Home" : "Accueil", path: `/${lang}` },
    { name: c.breadcrumbName, path: `/${lang}/a-propos` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: c.seoTitle,
    description: c.seoDescription,
    inLanguage: LANG_META[lang].htmlLang,
    url: `https://iranobservatory.org/${lang}/a-propos`,
    publisher: {
      "@type": "Organization",
      name: "Iran Observatory · Decrypt & Intel",
      url: "https://iranobservatory.org",
    },
  };

  return (
    <EditorialPage
      lang={lang}
      label={c.label}
      title={c.title}
      breadcrumbs={breadcrumbs}
      jsonLd={jsonLd}
    >
      {c.body({ lang })}
    </EditorialPage>
  );
}
