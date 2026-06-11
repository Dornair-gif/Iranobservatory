import "./globals.css";

// Root layout is intentionally minimal. The `<html>` and `<body>` tags with
// proper lang + dir are set in the [lang]/layout because they depend on the
// route param. This file only ships globals.css and sets a safe default.

export const metadata = {
  metadataBase: new URL("https://iranobservatory.org"),
  title: {
    default: "Iran Observatory",
    template: "%s | Iran Observatory",
  },
  description:
    "Plateforme indépendante d'analyse stratégique sur l'Iran : veille vérifiée, décryptages structurels, anticipations longues.",
  openGraph: {
    siteName: "Iran Observatory",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
