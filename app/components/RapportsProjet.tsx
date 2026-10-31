"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ProjetRapport = {
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
};
type Phase = { nom: string; avancement: number };
type Materiau = { nom: string; quantite_prevue: number; prix_unitaire: number | null; statut: string };
type Element = { quantite: number; longueur: number | null; largeur: number | null; hauteur: number | null; etat: string };
type Membre = { nom: string; role: string | null; statut: string };

const SECTIONS = [
  { id: "infos", label: "Informations générales" },
  { id: "avancement", label: "Avancement et état des travaux" },
  { id: "couts", label: "Coûts et matériaux" },
  { id: "structure", label: "Structure" },
  { id: "topo", label: "Topographie" },
  { id: "equipe", label: "Équipe" },
];

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const fcfa = (n: number | null) => (n === null ? "—" : `${fmt(Math.round(n))} FCFA`);
const jour = (d: string) => new Date(d + "T00:00:00");
const formatDate = (d: string | null) =>
  d ? jour(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const couleurBarre = (n: number) => (n >= 100 ? "bg-green-500" : n >= 60 ? "bg-blue-500" : n >= 30 ? "bg-orange-400" : "bg-purple-500");

const couleursEtat: Record<string, string> = {
  "En cours": "bg-orange-100 text-orange-700",
  "En étude": "bg-purple-100 text-purple-700",
  Terminé: "bg-green-100 text-green-700",
};

export default function RapportsProjet({
  projetId,
  projet,
  joursRestants,
}: {
  projetId: string;
  projet: ProjetRapport;
  joursRestants: number | null;
}) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [zs, setZs] = useState<number[]>([]);
  const [dateRapport, setDateRapport] = useState("");
  const [sel, setSel] = useState<Record<string, boolean>>({
    infos: true,
    avancement: true,
    couts: true,
    structure: true,
    topo: false,
    equipe: true,
  });
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [message, setMessage] = useState("");

  const charger = useCallback(async () => {
    const [p, m, e, eq, t] = await Promise.all([
      supabase.from("phases").select("nom, avancement").eq("projet_id", projetId).order("created_at"),
      supabase.from("materiaux").select("nom, quantite_prevue, prix_unitaire, statut").eq("projet_id", projetId),
      supabase.from("elements_structure").select("quantite, longueur, largeur, hauteur, etat").eq("projet_id", projetId),
      supabase.from("membres_projet").select("nom, role, statut").eq("projet_id", projetId).order("created_at"),
      supabase.from("points_topo").select("z").eq("projet_id", projetId),
    ]);
    const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    setPhases((p.data ?? []).map((x) => ({ nom: x.nom, avancement: Number(x.avancement) })));
    setMateriaux(
      (m.data ?? []).map((x) => ({
        nom: x.nom,
        quantite_prevue: Number(x.quantite_prevue),
        prix_unitaire: n(x.prix_unitaire),
        statut: x.statut,
      }))
    );
    setElements(
      (e.data ?? []).map((x) => ({
        quantite: Number(x.quantite),
        longueur: n(x.longueur),
        largeur: n(x.largeur),
        hauteur: n(x.hauteur),
        etat: x.etat,
      }))
    );
    setMembres(eq.data ?? []);
    setZs((t.data ?? []).map((x) => Number(x.z)));
    setDateRapport(new Date().toLocaleDateString("fr-FR"));
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Calculs du rapport
  const coutMateriaux = materiaux.reduce((s, x) => s + x.quantite_prevue * (x.prix_unitaire ?? 0), 0);
  const nonConformes = materiaux.filter((x) => x.statut === "Non conforme");
  const budgetUtilise =
    projet.budget && projet.cout_estime !== null ? Math.round((projet.cout_estime / projet.budget) * 100) : null;
  const pctMateriaux = projet.budget ? Math.round((coutMateriaux / projet.budget) * 100) : null;
  const nbElements = elements.reduce((s, x) => s + x.quantite, 0);
  const volume = elements.reduce(
    (s, x) => (x.longueur !== null && x.largeur !== null && x.hauteur !== null ? s + x.quantite * x.longueur * x.largeur * x.hauteur : s),
    0
  );
  const termines = elements.filter((x) => x.etat === "Terminé").length;
  const pctStructure = elements.length ? Math.round((termines / elements.length) * 100) : 0;
  const zmin = zs.length ? Math.min(...zs) : null;
  const zmax = zs.length ? Math.max(...zs) : null;
  const nbCoches = Object.values(sel).filter(Boolean).length;

  function basculer(id: string) {
    setSel({ ...sel, [id]: !sel[id] });
    setMessage("");
  }

  function genererCsv() {
    const l: (string | number)[][] = [["Section", "Libellé", "Valeur"]];
    l.push(["Synthèse", "Projet", projet.nom]);
    l.push(["Synthèse", "Avancement (%)", projet.avancement]);
    if (sel.infos) {
      l.push(["Informations", "Type", projet.type], ["Informations", "État", projet.etat]);
      l.push(["Informations", "Lieu", projet.lieu ?? ""], ["Informations", "Début", projet.date_debut ?? ""], ["Informations", "Fin", projet.date_fin ?? ""]);
      l.push(["Informations", "Budget (FCFA)", projet.budget ?? ""], ["Informations", "Maître d’ouvrage", projet.maitre_ouvrage ?? ""], ["Informations", "Responsable", projet.responsable ?? ""]);
    }
    if (sel.avancement) phases.forEach((p) => l.push(["Avancement", p.nom, `${p.avancement} %`]));
    if (sel.couts) {
      l.push(["Coûts", "Coût estimé (FCFA)", projet.cout_estime ?? ""], ["Coûts", "Coût des matériaux (FCFA)", Math.round(coutMateriaux)]);
      materiaux.forEach((x) => l.push(["Matériaux", `${x.nom} (${x.statut})`, Math.round(x.quantite_prevue * (x.prix_unitaire ?? 0))]));
    }
    if (sel.structure) {
      l.push(["Structure", "Éléments", nbElements], ["Structure", "Volume béton (m³)", Number(volume.toFixed(2))], ["Structure", "Lignes terminées (%)", pctStructure]);
    }
    if (sel.topo) {
      l.push(["Topographie", "Points relevés", zs.length], ["Topographie", "Altitude min (m)", zmin ?? ""], ["Topographie", "Altitude max (m)", zmax ?? ""]);
    }
    if (sel.equipe) membres.forEach((x) => l.push(["Équipe", x.nom, `${x.role ?? ""} (${x.statut})`]));

    const echapper = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const contenu = "\uFEFF" + l.map((ligne) => ligne.map(echapper).join(";")).join("\n");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
    lien.download = `rapport-${projet.nom.replace(/\s+/g, "-").toLowerCase()}.csv`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  function generer() {
    if (nbCoches === 0) return setMessage("Cochez au moins une section.");
    setMessage("");
    if (format === "pdf") window.print();
    else genererCsv();
  }

  const ligne = (libelle: string, valeur: string, cle?: number) => (
    <div key={cle} className="flex justify-between gap-4 border-b py-1.5 text-sm last:border-b-0">
      <span className="text-slate-500">{libelle}</span>
      <span className="text-right font-medium">{valeur}</span>
    </div>
  );

  const barre = (pct: number, couleur: string) => (
    <div className="h-2 flex-1 rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${couleur}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <style>{`@media print {
        body * { visibility: hidden; }
        #rapport-apercu, #rapport-apercu * { visibility: visible; }
        #rapport-apercu { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
        @page { margin: 14mm; }
      }`}</style>

      {/* Réglages */}
      <div className="h-fit rounded-xl border bg-white p-4">
        <h3 className="mb-3 font-semibold">Contenu du rapport</h3>
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sel[s.id]} onChange={() => basculer(s.id)} className="h-4 w-4" />
              {s.label}
            </label>
          ))}
        </div>

        <h3 className="mb-2 mt-5 font-semibold">Format</h3>
        <div className="flex gap-2">
          {([["pdf", "PDF"], ["csv", "Excel (CSV)"]] as const).map(([k, libelle]) => (
            <button
              key={k}
              onClick={() => setFormat(k)}
              className={`rounded-full px-3 py-1.5 text-sm ${format === k ? "bg-blue-600 text-white" : "border text-slate-600"}`}
            >
              {libelle}
            </button>
          ))}
        </div>

        <button onClick={generer} className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          {format === "pdf" ? "Générer le PDF" : "Exporter en CSV"}
        </button>
        {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
        {format === "pdf" && (
          <p className="mt-2 text-xs text-slate-500">
            Une fenêtre d’impression s’ouvre : choisissez « Enregistrer au format PDF » comme imprimante.
          </p>
        )}
      </div>

      {/* Aperçu */}
      <div className="lg:col-span-2">
        <p className="mb-2 text-sm text-slate-500">Aperçu</p>
        <div id="rapport-apercu" className="rounded-xl border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Rapport du projet</p>
              <h2 className="text-xl font-bold">{projet.nom}</h2>
              <p className="text-sm text-slate-500">
                {projet.type}
                {projet.date_debut && projet.date_fin ? ` · ${formatDate(projet.date_debut)} – ${formatDate(projet.date_fin)}` : ""}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${couleursEtat[projet.etat] ?? "bg-slate-100 text-slate-600"}`}>
              {projet.etat}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xl font-bold">{projet.avancement}%</p>
              <p className="text-xs text-slate-500">Avancement</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xl font-bold">{budgetUtilise !== null ? `${budgetUtilise}%` : "—"}</p>
              <p className="text-xs text-slate-500">Budget utilisé</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xl font-bold">{materiaux.length}</p>
              <p className="text-xs text-slate-500">Matériaux suivis</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xl font-bold">{membres.length}</p>
              <p className="text-xs text-slate-500">Membres d’équipe</p>
            </div>
          </div>

          {nbCoches === 0 && <p className="mt-6 text-center text-sm text-slate-500">Cochez au moins une section.</p>}

          {sel.infos && (
            <section className="mt-5 border-t pt-4">
              <h4 className="mb-2 text-sm font-semibold">Informations générales</h4>
              {ligne("Lieu", projet.lieu || "—")}
              {ligne("Maître d’ouvrage", projet.maitre_ouvrage || "—")}
              {ligne("Responsable", projet.responsable || "—")}
              {ligne("Budget prévisionnel", fcfa(projet.budget))}
              {ligne("Jours restants", joursRestants !== null ? `${joursRestants} jours` : "—")}
              {projet.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{projet.description}</p>}
            </section>
          )}

          {sel.avancement && (
            <section className="mt-5 border-t pt-4">
              <h4 className="mb-2 text-sm font-semibold">Avancement et état des travaux</h4>
              <div className="space-y-2">
                {phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 truncate text-slate-600">{p.nom}</span>
                    {barre(p.avancement, couleurBarre(p.avancement))}
                    <span className="w-10 text-right">{p.avancement}%</span>
                  </div>
                ))}
                {phases.length === 0 && <p className="text-sm text-slate-500">Aucune phase renseignée.</p>}
              </div>
            </section>
          )}

          {sel.couts && (
            <section className="mt-5 border-t pt-4">
              <h4 className="mb-2 text-sm font-semibold">Coûts et matériaux</h4>
              {ligne("Coût estimé / budget", `${fcfa(projet.cout_estime)} / ${fcfa(projet.budget)}`)}
              {ligne("Coût des matériaux", `${fcfa(coutMateriaux)}${pctMateriaux !== null ? ` (${pctMateriaux}% du budget)` : ""}`)}
              {ligne("Matériaux non conformes", nonConformes.length ? nonConformes.map((x) => x.nom).join(", ") : "Aucun")}
            </section>
          )}

          {sel.structure && (
            <section className="mt-5 border-t pt-4">
              <h4 className="mb-2 text-sm font-semibold">Structure</h4>
              {ligne("Éléments suivis", String(nbElements))}
              {ligne("Volume de béton", `${fmt(volume)} m³`)}
              <div className="flex items-center gap-3 pt-2 text-sm">
                <span className="w-32 shrink-0 text-slate-500">Réalisée</span>
                {barre(pctStructure, "bg-green-500")}
                <span className="w-10 text-right">{pctStructure}%</span>
              </div>
            </section>
          )}

          {sel.topo && (
            <section className="mt-5 border-t pt-4">
              <h4 className="mb-2 text-sm font-semibold">Topographie</h4>
              {ligne("Points relevés", String(zs.length))}
              {ligne("Altitude min / max", zmin !== null && zmax !== null ? `${fmt(zmin)} m / ${fmt(zmax)} m` : "—")}
              {ligne("Dénivelé", zmin !== null && zmax !== null ? `${fmt(zmax - zmin)} m` : "—")}
            </section>
          )}

          {sel.equipe && (
            <section className="mt-5 border-t pt-4">
              <h4 className="mb-2 text-sm font-semibold">Équipe</h4>
              {membres.map((m, i) => ligne(m.nom, `${m.role || "Rôle non précisé"} · ${m.statut}`, i))}
              {membres.length === 0 && <p className="text-sm text-slate-500">Aucun membre renseigné.</p>}
            </section>
          )}

          <p className="mt-6 border-t pt-3 text-center text-xs text-slate-400">Généré le {dateRapport} · Ronelbuild</p>
        </div>
      </div>
    </div>
  );
}
