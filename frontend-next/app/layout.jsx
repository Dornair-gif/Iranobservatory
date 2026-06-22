import "./globals.css";

// Root layout is intentionally minimal. The `<html>` and `<body>` tags with
// proper lang + dir are set in the [lang]/layout because they depend on the
// route param. This file only ships globals.css and sets a safe default.

export const metadata = {
  metadataBase: new URL("https://iranobservatory.org"),
  title: {
    default: "Iran Observatory · Decrypt & Intel — Strategic Iran Analysis",
    template: "%s · Iran Observatory · Decrypt & Intel",
  },
  description:
    "Iran Observatory · Decrypt & Intel — Plateforme indépendante de décryptage et d'intelligence stratégique sur l'Iran : OSINT vérifié, analyses signées, anticipations longues pour décideurs européens.",
  // Keywords are weakly used by Google but help Bing, DuckDuckGo and some
  // social networks. We list every long-tail combination we want to own.
  keywords: [
    "Iran Observatory",
    "Iran Observatory Decrypt",
    "Iran Observatory Intel",
    "Iran decrypt",
    "Iran intel",
    "Iran intelligence stratégique",
    "Iran OSINT",
    "décryptage Iran",
    "analyse Iran",
    "IRGC analyse",
    "sanctions Iran",
    "Maneli Mirkhan",
    "Iran observatoire",
    "rصدخانه ایران",
  ],
  applicationName: "Iran Observatory · Decrypt & Intel",
  authors: [{ name: "Maneli Mirkhan", url: "https://iranobservatory.org/fr/manifeste" }],
  creator: "Maneli Mirkhan",
  publisher: "Iran Observatory",
  openGraph: {
    siteName: "Iran Observatory · Decrypt & Intel",
    type: "website",
    title: "Iran Observatory · Decrypt & Intel",
    description:
      "Independent strategic intelligence and decryption of Iran. OSINT verified. For European decision-makers.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@IrObservatory",
    creator: "@ManeliMirkhan",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Placeholder — replace with the real Search Console verification token
    // once added (vercel domain has its own; do this when DNS switches).
    // google: "xxxxxxx",
  },
};

// Organization-level JSON-LD injected once at the root. Lists every name
// variant we want Google to associate with Maneli Mirkhan's project so that
// searches for "Iran Decrypt", "Iran Intel", "Iran Observatory by Maneli",
// etc. all resolve to this site, not to the astronomy facility.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "@id": "https://iranobservatory.org/#organization",
  name: "Iran Observatory · Decrypt & Intel",
  alternateName: [
    "Iran Observatory",
    "Iran Decrypt",
    "Iran Intel",
    "Observatoire de l'Iran",
    "رصدخانه ایران",
    "Iran Observatory by Maneli Mirkhan",
  ],
  url: "https://iranobservatory.org",
  logo: "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png",
  description:
    "Independent strategic intelligence and decryption platform on Iran. Verified OSINT, signed analyses, long-horizon forecasts.",
  foundingDate: "2025",
  founder: {
    "@type": "Person",
    name: "Maneli Mirkhan",
    jobTitle: "Founder & Editor-in-Chief",
    sameAs: ["https://manelimirkhan.com"],
  },
  knowsAbout: [
    "Iran politics",
    "Iranian Revolutionary Guard Corps (IRGC)",
    "Iran sanctions",
    "Iran economy",
    "Iran human rights",
    "Iran geopolitics",
    "Middle East strategic analysis",
  ],
  sameAs: [
    "https://x.com/IrObservatory",
    "https://x.com/ObservatoireIR",
    "https://www.instagram.com/iranobservatory",
    "https://www.linkedin.com/company/iran-observatory/",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Organization schema — every page inherits this signal */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
