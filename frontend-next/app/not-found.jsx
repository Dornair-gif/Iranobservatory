import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1E3A5F] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3DB883] mb-4">404</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
          Page introuvable
        </h1>
        <p className="text-zinc-300 mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/fr"
          className="inline-block px-6 py-3 bg-[#3DB883] text-[#1E3A5F] font-mono text-xs uppercase tracking-widest hover:bg-white transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
