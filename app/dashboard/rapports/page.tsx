"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import RapportsProjet from "../../components/RapportsProjet";

type Projet = {
  id: string;
  nom: string;
  type: string;
  etat: string;
  lieu: string | null;
  date_debut: string | null;
  date_fin: string | null;
  budget: number | null;
  cout_estime: number | null;
  avancement: number;
  maitre_ouvrage: string | null;
  responsable: string | null;
  description: string | null;
  updated_at: string;
  jours_restants: number | null;
};

const FILTRES = ["Tous", "En étude", "En cours", "Terminé"];
const couleursEtat: Record<string, string> = {
  "En cours": "bg-orange-100 text-orange-700",
  "En étude": "bg-purple-100 text-purple-700",
  Terminé: "bg-green-100 text-green-700",
};

export default function PageRapports() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from("projets")
        .select(
          "id, nom, type, etat, lieu, date_debut, date_fin, budget, cout_estime, avancement, maitre_ouvrage, responsable, description, updated_at"
        )
        .order("nom");
      const maintenant = Date.now();
      const liste: Projet[] = (data ?? []).map((p) => ({
        ...p,
        budget: p.budget === null ? null : Number(p.budget),
        cout_estime: p.cout_estime === null ? null : Number(p.cout_estime),
        avancement: Number(p.avancement ?? 0),
        jours_restants: p.date_fin
          ? Math.max(0, Math.ceil((new Date(p.date_fin + "T00:00:00").getTime() - maintenant) / 86400000))
          : null,
      }));
      setProjets(liste);
      setChoisi((actuel) => actuel ?? liste[0]?.id ?? null);
      setChargement(false);
    }
    charger();
  }, []);

  const affiches = projets.filter(
    (p) =>
      (filtre === "Tous" || p.etat === filtre) && p.nom.toLowerCase().includes(recherche.toLowerCase())
  );
  const projet = projets.find((p) => p.id === choisi) ?? null;

  function exporterRecap() {
    const echapper = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lignes: (string | number | null)[][] = [
      ["Projet", "Type", "État", "Lieu", "Début", "Fin", "Budget (FCFA)", "Coût estimé (FCFA)", "Avancement (%)", "Maître d’ouvrage", "Responsable"],
      ...projets.map((p) => [p.nom, p.type, p.etat, p.lieu, p.date_debut, p.date_fin, p.budget, p.cout_estime, p.avancement, p.maitre_ouvrage, p.responsable]),
    ];
    const contenu = "\uFEFF" + lignes.map((l) => l.map(echapper).join(";")).join("\n");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
    lien.download = "recapitulatif-projets.csv";
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Rapports</h2>
          <p className="text-slate-500">Un rapport par projet : choisissez un projet, puis générez son rapport.</p>
        </div>
        <button
          onClick={exporterRecap}
          disabled={projets.length === 0}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Récapitulatif de tous les projets (CSV)
        </button>
      </div>

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
              className={`rounded-full px-3 py-1.5 text-sm ${filtre === f ? "bg-blue-600 text-white" : "border bg-white text-slate-600"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {chargement && <p className="text-slate-500">Chargement…</p>}
      {!chargement && projets.length === 0 && (
        <p className="rounded-xl border bg-white p-6 text-center text-slate-500">
          Aucun projet. Créez un projet depuis le tableau de bord pour générer des rapports.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {affiches.map((p) => (
          <button
            key={p.id}
            onClick={() => setChoisi(p.id)}
            className={`rounded-xl border bg-white p-4 text-left transition hover:border-blue-400 ${
              choisi === p.id ? "border-blue-600 ring-2 ring-blue-200" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.nom}</p>
                <p className="text-xs text-slate-500">{p.type}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${couleursEtat[p.etat] ?? "bg-slate-100 text-slate-600"}`}>
                {p.etat}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.min(100, p.avancement)}%` }} />
              </div>
              <span className="text-xs font-medium">{p.avancement}%</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Modifié le {new Date(p.updated_at).toLocaleDateString("fr-FR")}
            </p>
          </button>
        ))}
      </div>
      {!chargement && projets.length > 0 && affiches.length === 0 && (
        <p className="py-4 text-center text-slate-500">Aucun projet ne correspond.</p>
      )}

      {projet && (
        <section className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Rapport · {projet.nom}</h3>
          <RapportsProjet key={projet.id} projetId={projet.id} projet={projet} joursRestants={projet.jours_restants} />
        </section>
      )}
    </main>
  );
}
