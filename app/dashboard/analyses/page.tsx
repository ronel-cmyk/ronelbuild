"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import GraphiqueEtats from "../../components/GraphiqueEtats";

type Projet = { id: string; type: string; etat: string };

const TYPES = ["Bâtiment", "Route", "Pont", "Hydraulique", "Autre"];
const couleursTypes: Record<string, string> = {
  Bâtiment: "bg-blue-500",
  Route: "bg-purple-400",
  Pont: "bg-red-400",
  Hydraulique: "bg-orange-400",
  Autre: "bg-blue-600",
};

export default function PageAnalyses() {
  const [projets, setProjets] = useState<Projet[]>([]);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from("projets").select("id, type, etat");
      setProjets(data ?? []);
    }
    charger();
  }, []);

  const parType = TYPES.map((t) => ({ t, n: projets.filter((p) => p.type === t).length }));
  const maxType = Math.max(1, ...parType.map((x) => x.n));
  const termines = projets.filter((p) => p.etat === "Terminé").length;
  const taux = projets.length ? Math.round((termines / projets.length) * 100) : 0;

  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold">Analyses</h2>
      <p className="mb-6 text-slate-500">Vue d’ensemble de vos projets.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 font-semibold">État global des projets</h3>
          <GraphiqueEtats projets={projets} />
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-4 font-semibold">Répartition par type</h3>
          <div className="space-y-3">
            {parType.map(({ t, n }) => (
              <div key={t} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-slate-600">{t}</span>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div
                    className={`h-3 rounded-full ${couleursTypes[t] ?? "bg-slate-400"}`}
                    style={{ width: `${(n / maxType) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right font-medium">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h3 className="mb-1 font-semibold">Taux d’achèvement</h3>
          <p className="mb-3 text-sm text-slate-500">
            {termines} projet(s) terminé(s) sur {projets.length}.
          </p>
          <div className="h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-green-500" style={{ width: `${taux}%` }} />
          </div>
          <p className="mt-2 text-right text-sm font-medium">{taux} %</p>
        </div>
      </div>
    </main>
  );
}
