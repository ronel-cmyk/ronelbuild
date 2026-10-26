"use client";
import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase";

type Materiau = {
  id: string;
  nom: string;
  type_materiau: string | null;
  norme: string | null;
  unite: string;
  quantite_prevue: number;
  quantite_utilisee: number;
  prix_unitaire: number | null;
  fournisseur: string | null;
  statut: string;
};

const TYPES = ["Ciment", "Granulat", "Acier", "Maçonnerie", "Bois", "Béton", "Autre"];
const UNITES = ["kg", "t", "m³", "m²", "m", "sac", "L", "u"];
const STATUTS = ["En attente", "En cours", "Conforme", "Non conforme"];
const FILTRES = ["Tous", ...STATUTS];

const couleursStatut: Record<string, string> = {
  Conforme: "bg-green-100 text-green-700",
  "En cours": "bg-orange-100 text-orange-700",
  "En attente": "bg-slate-100 text-slate-600",
  "Non conforme": "bg-red-100 text-red-700",
};
const couleursType: Record<string, string> = {
  Ciment: "bg-slate-200 text-slate-700",
  Granulat: "bg-amber-100 text-amber-700",
  Acier: "bg-zinc-300 text-zinc-800",
  "Maçonnerie": "bg-orange-100 text-orange-700",
  Bois: "bg-yellow-100 text-yellow-800",
  "Béton": "bg-blue-100 text-blue-700",
  Autre: "bg-purple-100 text-purple-700",
};
const PALETTE = ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#14b8a6", "#94a3b8"];

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const fcfa = (n: number) => `${fmt(Math.round(n))} FCFA`;
const nombre = (v: string) => (v.trim() === "" ? null : parseFloat(v.replace(/\s/g, "").replace(",", ".")));
const abrege = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(".", ",")} Md`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  return n.toLocaleString("fr-FR");
};
const cout = (m: Materiau) => m.quantite_prevue * (m.prix_unitaire ?? 0);

export default function MateriauxProjet({ projetId, budget }: { projetId: string; budget: number | null }) {
  const [liste, setListe] = useState<Materiau[]>([]);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [formOuvert, setFormOuvert] = useState(false);
  const [listeFournisseurs, setListeFournisseurs] = useState(false);
  const [f, setF] = useState({ nom: "", type: "Ciment", norme: "", unite: "sac", prevue: "", prix: "", fournisseur: "" });
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("materiaux")
      .select("id, nom, type_materiau, norme, unite, quantite_prevue, quantite_utilisee, prix_unitaire, fournisseur, statut")
      .eq("projet_id", projetId)
      .order("created_at");
    setListe(
      (data ?? []).map((m) => ({
        ...m,
        quantite_prevue: Number(m.quantite_prevue),
        quantite_utilisee: Number(m.quantite_utilisee),
        prix_unitaire: m.prix_unitaire === null ? null : Number(m.prix_unitaire),
      }))
    );
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const prevue = nombre(f.prevue);
    const prix = nombre(f.prix);
    if (prevue === null || isNaN(prevue) || prevue < 0) return setErreur("La quantité prévue doit être un nombre positif.");
    if (prix !== null && (isNaN(prix) || prix < 0)) return setErreur("Le prix doit être un nombre positif.");
    const { error } = await supabase.from("materiaux").insert({
      projet_id: projetId,
      nom: f.nom.trim(),
      type_materiau: f.type,
      norme: f.norme.trim() || null,
      unite: f.unite,
      quantite_prevue: prevue,
      prix_unitaire: prix,
      fournisseur: f.fournisseur.trim() || null,
    });
    if (error) return setErreur(error.message);
    setF({ ...f, nom: "", norme: "", prevue: "", prix: "", fournisseur: "" });
    setFormOuvert(false);
    await charger();
  }

  async function changerUtilisee(m: Materiau, valeur: string) {
    const n = nombre(valeur);
    if (n === null || isNaN(n) || n < 0 || n === m.quantite_utilisee) return charger();
    const { error } = await supabase.from("materiaux").update({ quantite_utilisee: n }).eq("id", m.id);
    if (error) setErreur(error.message);
    await charger();
  }

  async function changerStatut(m: Materiau, statut: string) {
    const { error } = await supabase.from("materiaux").update({ statut }).eq("id", m.id);
    if (error) setErreur(error.message);
    await charger();
  }

  async function supprimer(m: Materiau) {
    if (!window.confirm(`Supprimer « ${m.nom} » ?`)) return;
    await supabase.from("materiaux").delete().eq("id", m.id);
    await charger();
  }

  function exporterCsv() {
    const echapper = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lignes = [
      ["Matériau", "Type", "Norme", "Unité", "Quantité prévue", "Quantité utilisée", "Prix unitaire (FCFA)", "Coût estimé (FCFA)", "Fournisseur", "Statut"],
      ...liste.map((m) => [m.nom, m.type_materiau, m.norme, m.unite, m.quantite_prevue, m.quantite_utilisee, m.prix_unitaire, Math.round(cout(m)), m.fournisseur, m.statut]),
    ];
    const contenu = "\uFEFF" + lignes.map((l) => l.map(echapper).join(";")).join("\n");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
    lien.download = "materiaux.csv";
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  // Calculs de synthèse
  const coutPrevu = liste.reduce((s, m) => s + cout(m), 0);
  const coutConsomme = liste.reduce((s, m) => s + m.quantite_utilisee * (m.prix_unitaire ?? 0), 0);
  const pctBudget = budget && budget > 0 ? Math.round((coutPrevu / budget) * 100) : null;
  const depassements = liste.filter((m) => m.quantite_utilisee > m.quantite_prevue);

  const fournisseurs = new Map<string, number>();
  liste.forEach((m) => {
    const nomF = m.fournisseur?.trim();
    if (nomF) fournisseurs.set(nomF, (fournisseurs.get(nomF) ?? 0) + 1);
  });

  // Données de l'anneau : 5 plus gros postes + "Autres"
  const triees = liste.filter((m) => cout(m) > 0).sort((a, b) => cout(b) - cout(a));
  const donnees = triees.slice(0, 5).map((m) => ({ name: m.nom, value: cout(m) }));
  const reste = triees.slice(5).reduce((s, m) => s + cout(m), 0);
  if (reste > 0) donnees.push({ name: "Autres", value: reste });

  const affiches = liste.filter(
    (m) =>
      (filtre === "Tous" || m.statut === filtre) &&
      `${m.nom} ${m.type_materiau ?? ""} ${m.norme ?? ""}`.toLowerCase().includes(recherche.toLowerCase())
  );
  const champ = "rounded-md border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      {depassements.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-semibold">
            {depassements.length} matériau{depassements.length > 1 ? "x" : ""} dépasse{depassements.length > 1 ? "nt" : ""} la quantité prévue :
          </span>{" "}
          {depassements.map((m) => m.nom).join(", ")}.
        </div>
      )}

      {/* Cartes de synthèse */}
      <div className="grid items-start gap-4 md:grid-cols">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Matériaux principaux</p>
          <p className="text-3xl font-bold">{liste.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Coût total des matériaux</p>
          <p className="text-2xl font-bold">{fcfa(coutPrevu)}</p>
          <p className="text-xs text-slate-500">
            Consommé : {fcfa(coutConsomme)}
            {budget ? ` · Budget : ${fcfa(budget)}` : " · Budget non renseigné"}
          </p>
          {pctBudget !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${pctBudget > 100 ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min(100, pctBudget)}%` }}
                />
              </div>
              <span className="text-xs font-medium">{pctBudget}%</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Fournisseurs</p>
          <p className="text-3xl font-bold">{fournisseurs.size}</p>
          <button
            onClick={() => setListeFournisseurs(!listeFournisseurs)}
            className="text-sm text-blue-600 hover:underline"
          >
            {listeFournisseurs ? "Masquer la liste" : "Voir la liste →"}
          </button>
          {listeFournisseurs && (
            <ul className="mt-2 space-y-1 text-sm">
              {[...fournisseurs.entries()].map(([nomF, n]) => (
                <li key={nomF} className="flex justify-between">
                  <span>{nomF}</span>
                  <span className="text-slate-500">{n} matériau{n > 1 ? "x" : ""}</span>
                </li>
              ))}
              {fournisseurs.size === 0 && <li className="text-slate-500">Aucun fournisseur renseigné.</li>}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tableau */}
        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Matériaux utilisés</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                className="w-36 rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={exporterCsv} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
                Exporter CSV
              </button>
              <button
                onClick={() => setFormOuvert(!formOuvert)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {formOuvert ? "Fermer" : "+ Ajouter"}
              </button>
            </div>
          </div>

          {formOuvert && (
            <form onSubmit={ajouter} className="mb-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <input required placeholder="Matériau (ex. Ciment Portland)" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} className={`${champ} lg:col-span-2`} />
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={champ} aria-label="Type">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input placeholder="Norme (ex. NF EN 197-1)" value={f.norme} onChange={(e) => setF({ ...f, norme: e.target.value })} className={champ} />
              <input required inputMode="decimal" placeholder="Quantité prévue" value={f.prevue} onChange={(e) => setF({ ...f, prevue: e.target.value })} className={champ} />
              <select value={f.unite} onChange={(e) => setF({ ...f, unite: e.target.value })} className={champ} aria-label="Unité">
                {UNITES.map((u) => <option key={u}>{u}</option>)}
              </select>
              <input inputMode="decimal" placeholder="Prix unitaire (FCFA)" value={f.prix} onChange={(e) => setF({ ...f, prix: e.target.value })} className={champ} />
              <input placeholder="Fournisseur" value={f.fournisseur} onChange={(e) => setF({ ...f, fournisseur: e.target.value })} className={champ} />
              <div className="sm:col-span-2 lg:col-span-4">
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Enregistrer le matériau
                </button>
              </div>
            </form>
          )}
          {erreur && <p className="mb-2 text-sm text-red-600">{erreur}</p>}

          <div className="mb-3 flex flex-wrap gap-2">
            {FILTRES.map((s) => (
              <button
                key={s}
                onClick={() => setFiltre(s)}
                className={`rounded-full px-3 py-1 text-xs ${filtre === s ? "bg-blue-600 text-white" : "border text-slate-600"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Matériau</th>
                  <th className="font-medium">Type</th>
                  <th className="font-medium">Norme</th>
                  <th className="font-medium">Prévu</th>
                  <th className="font-medium">Utilisé</th>
                  <th className="font-medium">Unité</th>
                  <th className="font-medium">Coût estimé</th>
                  <th className="font-medium">Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {affiches.map((m) => {
                  const pct = m.quantite_prevue > 0 ? Math.min(100, (m.quantite_utilisee / m.quantite_prevue) * 100) : 0;
                  const depasse = m.quantite_utilisee > m.quantite_prevue;
                  return (
                    <tr key={m.id} className="border-t">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold ${couleursType[m.type_materiau ?? "Autre"] ?? couleursType.Autre}`}>
                            {(m.nom[0] ?? "?").toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium">{m.nom}</p>
                            {m.fournisseur && <p className="text-xs text-slate-500">{m.fournisseur}</p>}
                          </div>
                        </div>
                      </td>
                      <td>{m.type_materiau || "—"}</td>
                      <td className="text-slate-600">{m.norme || "—"}</td>
                      <td className="font-medium">{fmt(m.quantite_prevue)}</td>
                      <td>
                        <input
                          key={`${m.id}-${m.quantite_utilisee}`}
                          defaultValue={m.quantite_utilisee}
                          inputMode="decimal"
                          onBlur={(e) => changerUtilisee(m, e.target.value)}
                          className={`w-20 rounded border px-1 py-0.5 ${depasse ? "border-red-400 text-red-600" : "border-slate-300"}`}
                          aria-label={`Quantité utilisée de ${m.nom}`}
                        />
                        <div className="mt-1 h-1 w-20 rounded-full bg-slate-100">
                          <div className={`h-1 rounded-full ${depasse ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td>{m.unite}</td>
                      <td>{m.prix_unitaire !== null ? fcfa(cout(m)) : "—"}</td>
                      <td>
                        <select
                          value={m.statut}
                          onChange={(e) => changerStatut(m, e.target.value)}
                          className={`rounded-full px-2 py-1 text-xs ${couleursStatut[m.statut] ?? ""}`}
                          aria-label={`Statut de ${m.nom}`}
                        >
                          {STATUTS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="text-right">
                        <button onClick={() => supprimer(m)} className="text-red-600" aria-label={`Supprimer ${m.nom}`}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {affiches.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              {liste.length === 0 ? "Aucun matériau. Cliquez sur « + Ajouter » pour commencer." : "Aucun matériau ne correspond."}
            </p>
          )}
        </div>

        {/* Répartition des coûts */}
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-4 font-semibold">Répartition des coûts</h3>
          {coutPrevu > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-44 w-44">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={donnees} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">
                      {donnees.map((d, i) => (
                        <Cell key={d.name + i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{abrege(coutPrevu)}</span>
                  <span className="text-xs text-slate-500">FCFA</span>
                </div>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {donnees.map((d, i) => (
                  <li key={d.name + i} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="flex-1 truncate text-slate-600">{d.name}</span>
                    <span className="font-medium">{Math.round((d.value / coutPrevu) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Ajoutez des matériaux avec un prix unitaire pour voir la répartition.</p>
          )}
        </div>
      </div>
    </div>
  );
}
