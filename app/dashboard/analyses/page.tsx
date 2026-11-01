"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "../../../lib/supabase";
import GraphiqueEtats from "../../components/GraphiqueEtats";

type Projet = {
  id: string;
  nom: string;
  type: string;
  etat: string;
  budget: number | null;
  cout_estime: number | null;
  avancement: number;
};
type Membre = { projet_id: string; nom: string; statut: string };
type Materiau = {
  projet_id: string;
  quantite_prevue: number;
  quantite_utilisee: number;
  prix_unitaire: number | null;
  statut: string;
};
type Element = {
  projet_id: string;
  quantite: number;
  longueur: number | null;
  largeur: number | null;
  hauteur: number | null;
};

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const fcfa = (n: number) => `${fmt(Math.round(n))} FCFA`;
const abrege = (n: number) => {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2).replace(".", ",")} Md`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  return n.toLocaleString("fr-FR");
};
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function Carte({ titre, valeur, aide, alerte }: { titre: string; valeur: string; aide?: string; alerte?: boolean }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{titre}</p>
      <p className={`mt-1 text-2xl font-bold ${alerte ? "text-red-600" : ""}`}>{valeur}</p>
      {aide && <p className="mt-1 text-xs text-slate-500">{aide}</p>}
    </div>
  );
}

export default function PageAnalyses() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const [p, m, mat, e] = await Promise.all([
        supabase.from("projets").select("id, nom, type, etat, budget, cout_estime, avancement").order("nom"),
        supabase.from("membres_projet").select("projet_id, nom, statut"),
        supabase.from("materiaux").select("projet_id, quantite_prevue, quantite_utilisee, prix_unitaire, statut"),
        supabase.from("elements_structure").select("projet_id, quantite, longueur, largeur, hauteur"),
      ]);
      setProjets(
        (p.data ?? []).map((x) => ({
          ...x,
          budget: num(x.budget),
          cout_estime: num(x.cout_estime),
          avancement: Number(x.avancement ?? 0),
        }))
      );
      setMembres(m.data ?? []);
      setMateriaux(
        (mat.data ?? []).map((x) => ({
          projet_id: x.projet_id,
          quantite_prevue: Number(x.quantite_prevue),
          quantite_utilisee: Number(x.quantite_utilisee),
          prix_unitaire: num(x.prix_unitaire),
          statut: x.statut,
        }))
      );
      setElements(
        (e.data ?? []).map((x) => ({
          projet_id: x.projet_id,
          quantite: Number(x.quantite),
          longueur: num(x.longueur),
          largeur: num(x.largeur),
          hauteur: num(x.hauteur),
        }))
      );
      setChargement(false);
    }
    charger();
  }, []);

  // Indicateurs globaux, tous calculés à partir des données saisies dans les projets
  const devisTotal = projets.reduce((s, p) => s + (p.budget ?? 0), 0);
  const depensesTotales = projets.reduce((s, p) => s + (p.cout_estime ?? 0), 0);
  const reste = devisTotal - depensesTotales;
  const pctDepenses = devisTotal > 0 ? Math.round((depensesTotales / devisTotal) * 100) : null;

  const actifs = membres.filter((m) => m.statut === "Actif");
  const employesActifs = new Set(actifs.map((m) => m.nom.trim().toLowerCase())).size;

  const enCours = projets.filter((p) => p.etat === "En cours").length;
  const termines = projets.filter((p) => p.etat === "Terminé").length;
  const avancementMoyen = projets.length ? Math.round(projets.reduce((s, p) => s + p.avancement, 0) / projets.length) : 0;

  const coutMateriauxPrevu = materiaux.reduce((s, m) => s + m.quantite_prevue * (m.prix_unitaire ?? 0), 0);
  const coutMateriauxConsomme = materiaux.reduce((s, m) => s + m.quantite_utilisee * (m.prix_unitaire ?? 0), 0);
  const nonConformes = materiaux.filter((m) => m.statut === "Non conforme").length;
  const volumeBeton = elements.reduce(
    (s, x) => (x.longueur !== null && x.largeur !== null && x.hauteur !== null ? s + x.quantite * x.longueur * x.largeur * x.hauteur : s),
    0
  );

  const donneesGraphique = projets
    .filter((p) => (p.budget ?? 0) > 0 || (p.cout_estime ?? 0) > 0)
    .map((p) => ({
      nom: p.nom.length > 14 ? `${p.nom.slice(0, 13)}…` : p.nom,
      Devis: p.budget ?? 0,
      Dépenses: p.cout_estime ?? 0,
    }));

  const lignes = projets.map((p) => {
    const equipeActive = new Set(
      membres.filter((m) => m.projet_id === p.id && m.statut === "Actif").map((m) => m.nom.trim().toLowerCase())
    ).size;
    return { ...p, equipeActive, ecart: (p.budget ?? 0) - (p.cout_estime ?? 0) };
  });

  if (chargement) return <p className="p-6 text-slate-500">Chargement…</p>;

  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold">Analyses</h2>
      <p className="mb-6 text-slate-500">
        Vue d’ensemble de tous vos projets. Les chiffres se mettent à jour automatiquement à partir des données saisies dans les projets.
      </p>

      {projets.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-center text-slate-500">
          Aucun projet pour le moment. Créez un projet et renseignez son budget pour voir les analyses.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Carte titre="Devis total" valeur={`${abrege(devisTotal)} FCFA`} aide={`${projets.length} projet(s) · ${fcfa(devisTotal)}`} />
            <Carte
              titre="Dépenses totales"
              valeur={`${abrege(depensesTotales)} FCFA`}
              aide={pctDepenses !== null ? `${pctDepenses}% du devis total` : "Coût estimé de chaque projet"}
            />
            <Carte
              titre={reste >= 0 ? "Reste sur le devis" : "Dépassement du devis"}
              valeur={`${abrege(Math.abs(reste))} FCFA`}
              alerte={reste < 0}
              aide={reste < 0 ? "Les dépenses dépassent le devis" : "Devis moins dépenses"}
            />
            <Carte titre="Employés actifs" valeur={String(employesActifs)} aide={`${actifs.length} affectation(s) · compté une fois par personne`} />
            <Carte titre="Projets en cours" valeur={String(enCours)} aide={`${termines} terminé(s) sur ${projets.length}`} />
            <Carte titre="Avancement moyen" valeur={`${avancementMoyen}%`} aide="Moyenne de tous les projets" />
            <Carte titre="Matériaux consommés" valeur={`${abrege(coutMateriauxConsomme)} FCFA`} aide={`Prévu : ${abrege(coutMateriauxPrevu)} FCFA`} />
            <Carte
              titre="Non-conformités"
              valeur={String(nonConformes)}
              alerte={nonConformes > 0}
              aide={`Béton suivi : ${fmt(volumeBeton)} m³`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 lg:col-span-2">
              <h3 className="mb-3 font-semibold">Devis et dépenses par projet</h3>
              {donneesGraphique.length > 0 ? (
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={donneesGraphique} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => abrege(Number(v))} tick={{ fontSize: 12 }} width={60} />
                      <Tooltip formatter={(v) => fcfa(Number(v))} />
                      <Legend />
                      <Bar dataKey="Devis" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Dépenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">
                  Renseignez le budget et le coût estimé d’un projet (bouton « Modifier » de sa fiche) pour voir le graphique.
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-3 font-semibold">État des projets</h3>
              <GraphiqueEtats projets={projets} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white p-4">
            <h3 className="mb-3 font-semibold">Détail par projet</h3>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Projet</th>
                  <th className="font-medium">Devis</th>
                  <th className="font-medium">Dépenses</th>
                  <th className="font-medium">Écart</th>
                  <th className="font-medium">Avancement</th>
                  <th className="font-medium">Équipe active</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-3 font-medium">{p.nom}</td>
                    <td>{p.budget !== null ? fcfa(p.budget) : "—"}</td>
                    <td>{p.cout_estime !== null ? fcfa(p.cout_estime) : "—"}</td>
                    <td className={p.ecart < 0 ? "font-medium text-red-600" : ""}>
                      {p.budget !== null ? fcfa(p.ecart) : "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.min(100, p.avancement)}%` }} />
                        </div>
                        <span>{p.avancement}%</span>
                      </div>
                    </td>
                    <td>{p.equipeActive}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="py-3">Total</td>
                  <td>{fcfa(devisTotal)}</td>
                  <td>{fcfa(depensesTotales)}</td>
                  <td className={reste < 0 ? "text-red-600" : ""}>{fcfa(reste)}</td>
                  <td>{avancementMoyen}%</td>
                  <td>{employesActifs}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
