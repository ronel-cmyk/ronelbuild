"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Projet = { id: string; nom: string; type: string; etat: string; updated_at: string };

const FILTRES = ["Tous", "En étude", "En cours", "Terminé"];
const couleurs: Record<string, string> = {
  "En cours": "bg-orange-100 text-orange-700",
  "En étude": "bg-purple-100 text-purple-700",
  Terminé: "bg-green-100 text-green-700",
};

export default function PageProjets() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [filtre, setFiltre] = useState("Tous");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from("projets")
        .select("*")
        .order("updated_at", { ascending: false });
      setProjets(data ?? []);
    }
    charger();
  }, []);

  const liste = projets.filter(
    (p) =>
      (filtre === "Tous" || p.etat === filtre) &&
      p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold">Projets</h2>
      <p className="mb-6 text-slate-500">{projets.length} projet(s) au total.</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un projet…"
          className="w-full max-w-xs rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filtre === f ? "bg-blue-600 text-white" : "bg-white text-slate-600 border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2 font-medium">Nom du projet</th>
              <th className="font-medium">Type</th>
              <th className="font-medium">État</th>
              <th className="font-medium">Dernière modification</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-3 font-medium">
                  <Link href={`/dashboard/projets/${p.id}`} className="text-blue-600 hover:underline">
                    {p.nom}
                  </Link>
                </td>
                <td>{p.type}</td>
                <td>
                  <span className={`rounded-full px-2 py-1 text-xs ${couleurs[p.etat] ?? ""}`}>
                    {p.etat}
                  </span>
                </td>
                <td>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {liste.length === 0 && (
          <p className="py-6 text-center text-slate-500">Aucun projet ne correspond.</p>
        )}
      </div>
    </main>
  );
}
