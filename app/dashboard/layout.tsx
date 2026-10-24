"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const menu = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projets", href: "/dashboard/projets" },
  { label: "Analyses", href: "/dashboard/analyses" },
  { label: "Données", href: "/dashboard/donnees" },
  { label: "Rapports", href: "/dashboard/rapports" },
  { label: "Documents", href: "/dashboard/documents" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [nom, setNom] = useState("");
  const [pret, setPret] = useState(false);

  useEffect(() => {
    async function verifier() {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return router.replace("/");
      const { data: profil } = await supabase
        .from("profiles")
        .select("nom")
        .eq("id", s.session.user.id)
        .single();
      setNom(profil?.nom ?? s.session.user.email ?? "");
      setPret(true);
    }
    verifier();
  }, [router]);

  async function deconnexion() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const actif = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  if (!pret) return <p className="p-6">Chargement…</p>;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Barre latérale (ordinateur) */}
      <aside className="hidden w-56 flex-col bg-[#0b1b3a] p-4 text-slate-300 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            R
          </span>
          <h1 className="text-lg font-bold text-white">Ronelbuild</h1>
        </div>
        <nav className="space-y-1">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`block rounded-lg px-3 py-2.5 text-sm ${
                actif(m.href) ? "bg-blue-600 font-medium text-white" : "hover:bg-white/10"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={deconnexion}
          className="mt-auto rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/10"
        >
          Se déconnecter
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b bg-white px-6 py-3">
          <h1 className="font-bold md:invisible">Ronelbuild</h1>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {(nom[0] ?? "?").toUpperCase()}
            </span>
            <div className="hidden text-sm leading-tight sm:block">
              <p className="font-semibold">{nom}</p>
              <p className="text-xs text-slate-500">Ingénieur</p>
            </div>
            <button onClick={deconnexion} className="text-sm text-slate-500 md:hidden">
              Quitter
            </button>
          </div>
        </header>

        {/* Menu horizontal (mobile) */}
        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 md:hidden">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                actif(m.href) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
