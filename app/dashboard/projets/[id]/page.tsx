"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import Geotechnique from "../../../../components/Geotechnique";
import EtatTravaux from "../../../components/EtatTravaux";
import EquipeProjet from "../../../components/EquipeProjet";
import EvolutionProjet from "../../../components/EvolutionProjet";
import MateriauxProjet from "../../../components/MateriauxProjet";
import StructureProjet from "../../../components/StructureProjet";

type Projet = {
  id: string;
  nom: string;
  type: string;
  etat: string;
  updated_at: string;
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
type Point = { id: string; nom: string; x: number; y: number; z: number; notes: string | null };
type Edition = {
  nom: string;
  type: string;
  etat: string;
  lieu: string;
  date_debut: string;
  date_fin: string;
  budget: string;
  cout_estime: string;
  maitre_ouvrage: string;
  responsable: string;
  description: string;
};

const ONGLETS = [
  "Vue d'ensemble",
  "Topographie",
  "Géotechnique",
  "Matériaux",
  "Structure",
  "Rapports",
];
const TYPES = ["Bâtiment", "Route", "Pont", "Hydraulique", "Autre"];
const ETATS = ["En étude", "En cours", "Terminé"];
const COLONNES =
  "id, nom, type, etat, updated_at, lieu, date_debut, date_fin, budget, cout_estime, avancement, maitre_ouvrage, responsable, description";

const jour = (d: string) => new Date(d + "T00:00:00");
const formatDate = (d: string | null) =>
  d ? jour(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fcfa = (n: number | null) => (n === null || n === undefined ? "—" : `${n.toLocaleString("fr-FR")} FCFA`);

export default function FicheProjet() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [joursRestants, setJoursRestants] = useState<number | null>(null);
  const [nbEquipe, setNbEquipe] = useState<number | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pret, setPret] = useState(false);
  const [onglet, setOnglet] = useState("Vue d'ensemble");
  const [f, setF] = useState({ nom: "", x: "", y: "", z: "", notes: "" });
  const [erreur, setErreur] = useState("");
  const [edition, setEdition] = useState<Edition | null>(null);
  const [erreurEdition, setErreurEdition] = useState("");

  const chargerProjet = useCallback(async () => {
    const { data: p } = await supabase.from("projets").select(COLONNES).eq("id", id).single();
    setProjet(p);
    if (p?.date_fin) {
      const diff = jour(p.date_fin).getTime() - Date.now();
      setJoursRestants(Math.max(0, Math.ceil(diff / 86400000)));
    } else {
      setJoursRestants(null);
    }
  }, [id]);

  const chargerPoints = useCallback(async () => {
    const { data } = await supabase
      .from("points_topo")
      .select("*")
      .eq("projet_id", id)
      .order("created_at");
    setPoints(data ?? []);
  }, [id]);

  useEffect(() => {
    async function charger() {
      await chargerProjet();
      await chargerPoints();
      setPret(true);
    }
    charger();
  }, [chargerProjet, chargerPoints]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const num = (v: string) => parseFloat(v.replace(",", "."));
    const x = num(f.x), y = num(f.y), z = num(f.z);
    if ([x, y, z].some(isNaN)) return setErreur("X, Y et Z doivent être des nombres.");
    const { error } = await supabase
      .from("points_topo")
      .insert({ projet_id: id, nom: f.nom, x, y, z, notes: f.notes || null });
    if (error) return setErreur(error.message);
    setF({ nom: "", x: "", y: "", z: "", notes: "" });
    await chargerPoints();
  }

  async function supprimer(p: Point) {
    if (!window.confirm(`Supprimer le point « ${p.nom} » ?`)) return;
    await supabase.from("points_topo").delete().eq("id", p.id);
    await chargerPoints();
  }

  function ouvrirEdition() {
    if (!projet) return;
    setErreurEdition("");
    setEdition({
      nom: projet.nom,
      type: projet.type,
      etat: projet.etat,
      lieu: projet.lieu ?? "",
      date_debut: projet.date_debut ?? "",
      date_fin: projet.date_fin ?? "",
      budget: projet.budget?.toString() ?? "",
      cout_estime: projet.cout_estime?.toString() ?? "",
      maitre_ouvrage: projet.maitre_ouvrage ?? "",
      responsable: projet.responsable ?? "",
      description: projet.description ?? "",
    });
  }

  async function enregistrerEdition(e: React.FormEvent) {
    e.preventDefault();
    if (!edition) return;
    setErreurEdition("");
    const nombre = (v: string) => (v.trim() === "" ? null : parseFloat(v.replace(/\s/g, "").replace(",", ".")));
    const budget = nombre(edition.budget);
    const cout = nombre(edition.cout_estime);
    if ([budget, cout].some((v) => v !== null && isNaN(v))) {
      return setErreurEdition("Budget et coût doivent être des nombres.");
    }
    if (edition.date_debut && edition.date_fin && edition.date_fin < edition.date_debut) {
      return setErreurEdition("La date de fin doit être après la date de début.");
    }
    const { error } = await supabase
      .from("projets")
      .update({
        nom: edition.nom,
        type: edition.type,
        etat: edition.etat,
        lieu: edition.lieu || null,
        date_debut: edition.date_debut || null,
        date_fin: edition.date_fin || null,
        budget,
        cout_estime: cout,
        maitre_ouvrage: edition.maitre_ouvrage || null,
        responsable: edition.responsable || null,
        description: edition.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return setErreurEdition(error.message);
    setEdition(null);
    await chargerProjet();
  }

  if (!pret) return <p className="p-6">Chargement…</p>;
  if (!projet) return <p className="p-6">Projet introuvable.</p>;

  const zs = points.map((p) => p.z);
  const zmin = zs.length ? Math.min(...zs) : null;
  const zmax = zs.length ? Math.max(...zs) : null;
  const denivele = zmin !== null && zmax !== null ? (zmax - zmin).toFixed(2) : "—";
  const champ = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";
  const dateModif = new Date(projet.updated_at).toLocaleDateString("fr-FR");
  const duree =
    projet.date_debut && projet.date_fin
      ? Math.round((jour(projet.date_fin).getTime() - jour(projet.date_debut).getTime()) / 86400000)
      : null;
  const pctBudget =
    projet.budget && projet.cout_estime !== null
      ? Math.min(100, Math.round((projet.cout_estime / projet.budget) * 100))
      : null;
  // Délai consommé : part de la durée déjà écoulée (0 à 100 %)
  const delaiPct =
    duree && joursRestants !== null
      ? Math.min(100, Math.max(0, Math.round(((duree - joursRestants) / duree) * 100)))
      : null;

  const barre = (pct: number, couleur: string) => (
    <div className="mt-2 h-2 rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${couleur}`} style={{ width: `${pct}%` }} />
    </div>
  );

  const carte = (valeur: string | number, libelle: string) => (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-2xl font-bold">{valeur}</p>
      <p className="text-sm text-slate-500">{libelle}</p>
    </div>
  );

  const info = (libelle: string, valeur: string | null) => (
    <div>
      <dt className="text-slate-500">{libelle}</dt>
      <dd className="font-medium">{valeur || "—"}</dd>
    </div>
  );

  return (
    <main className="p-6">
      {/* Fil d'Ariane + bouton */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/projets" className="hover:underline">Projets</Link>
          <span className="mx-2">›</span>
          <span className="font-medium text-slate-900">{projet.nom}</span>
        </p>
        <button
          onClick={ouvrirEdition}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Modifier
        </button>
      </div>

      {/* Bandeau */}
      <div className="mb-4 flex flex-col justify-between gap-4 rounded-xl bg-[#0b1b3a] p-6 text-white lg:flex-row lg:items-end">
        <div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{projet.etat}</span>
          <h1 className="mt-3 text-3xl font-bold">{projet.nom}</h1>
          <p className="mt-2 text-sm text-slate-300">{projet.lieu || "Lieu non renseigné"}</p>
          <p className="text-sm text-slate-300">
            {projet.date_debut && projet.date_fin
              ? `${formatDate(projet.date_debut)} – ${formatDate(projet.date_fin)}`
              : "Dates non renseignées"}
          </p>
          {nbEquipe !== null && (
            <p className="text-sm text-slate-300">
              Équipe : {nbEquipe} membre{nbEquipe > 1 ? "s" : ""}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">{projet.type} · modifié le {dateModif}</p>
        </div>
        <div className="w-full rounded-xl bg-white p-4 text-slate-900 lg:w-72">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Avancement global</span>
            <span className="font-semibold">{projet.avancement}%</span>
          </div>
          {barre(projet.avancement, "bg-green-500")}
        </div>
      </div>

      {/* Onglets */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-white px-2">
        {ONGLETS.map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`whitespace-nowrap px-4 py-3 text-sm ${
              onglet === o ? "border-b-2 border-blue-600 font-semibold text-blue-600" : "text-slate-500"
            }`}
          >
            {o}
          </button>
        ))}
      </div>

      {onglet === "Vue d'ensemble" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-slate-500">Avancement global</p>
              <p className="text-2xl font-bold">{projet.avancement}%</p>
              {barre(projet.avancement, "bg-green-500")}
              <p className="mt-1 text-xs text-slate-400">Calculé d’après l’état des travaux</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-slate-500">Durée du projet</p>
              <p className="text-2xl font-bold">{duree !== null ? `${duree} jours` : "—"}</p>
              <p className="mt-1 text-xs text-blue-600">
                {joursRestants !== null ? `Jours restants : ${joursRestants}` : "Dates à renseigner"}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-slate-500">Coût estimé</p>
              <p className="text-lg font-bold leading-8">{fcfa(projet.cout_estime)}</p>
              <p className="text-xs text-slate-500">
                Budget : {fcfa(projet.budget)}
                {pctBudget !== null && ` · ${pctBudget}%`}
              </p>
              {pctBudget !== null && barre(pctBudget, pctBudget > 100 ? "bg-red-500" : "bg-blue-500")}
            </div>
            {carte(points.length, "Points topographiques")}
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="mb-3 font-semibold">Informations du projet</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {info("Type d’ouvrage", projet.type)}
              {info("État", projet.etat)}
              {info("Lieu", projet.lieu)}
              {info("Maître d’ouvrage", projet.maitre_ouvrage)}
              {info("Responsable", projet.responsable)}
              {info("Budget prévisionnel", projet.budget !== null ? fcfa(projet.budget) : null)}
              {info("Dénivelé relevé", denivele === "—" ? null : `${denivele} m`)}
            </dl>
            <div className="mt-4 text-sm">
              <p className="text-slate-500">Description</p>
              <p className="whitespace-pre-line">{projet.description || "—"}</p>
            </div>
          </div>

          <EvolutionProjet
            projetId={id}
            avancement={projet.avancement}
            coutPct={pctBudget}
            delaiPct={delaiPct}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <EtatTravaux
              projetId={id}
              onAvancement={(n) => setProjet((p) => (p ? { ...p, avancement: n } : p))}
            />
            <EquipeProjet projetId={id} onNombre={setNbEquipe} />
          </div>
        </div>
      )}

      {onglet === "Géotechnique" && <Geotechnique projetId={id} />}

      {onglet === "Topographie" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {carte(points.length, "Points")}
            {carte(zmin ?? "—", "Altitude min (m)")}
            {carte(zmax ?? "—", "Altitude max (m)")}
            {carte(denivele, "Dénivelé (m)")}
          </div>

          <form onSubmit={ajouter} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm font-medium">Nom du point
              <input required placeholder="P001" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} className={champ} />
            </label>
            <label className="text-sm font-medium">X (m)
              <input required inputMode="decimal" value={f.x} onChange={(e) => setF({ ...f, x: e.target.value })} className={champ} />
            </label>
            <label className="text-sm font-medium">Y (m)
              <input required inputMode="decimal" value={f.y} onChange={(e) => setF({ ...f, y: e.target.value })} className={champ} />
            </label>
            <label className="text-sm font-medium">Z altitude (m)
              <input required inputMode="decimal" value={f.z} onChange={(e) => setF({ ...f, z: e.target.value })} className={champ} />
            </label>
            <label className="text-sm font-medium">Notes
              <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={champ} />
            </label>
            <div className="sm:col-span-2 lg:col-span-5">
              {erreur && <p className="mb-2 text-sm text-red-600">{erreur}</p>}
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                + Ajouter le point
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border bg-white p-4">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr><th className="py-2">Point</th><th>X</th><th>Y</th><th>Z</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-3 font-medium">{p.nom}</td>
                    <td>{p.x}</td><td>{p.y}</td><td>{p.z}</td>
                    <td>{p.notes}</td>
                    <td className="text-right"><button onClick={() => supprimer(p)} className="text-red-600">Supprimer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {points.length === 0 && <p className="py-6 text-center text-slate-500">Aucun point. Ajoutez le premier avec le formulaire ci-dessus.</p>}
          </div>
        </div>
      )}

      {onglet === "Matériaux" && <MateriauxProjet projetId={id} budget={projet.budget} />}

      {onglet === "Structure" && <StructureProjet projetId={id} />}

      {onglet === "Rapports" && (
        <div className="rounded-xl border bg-white p-6">
          <h3 className="font-semibold">{onglet}</h3>
          <p className="mt-1 text-sm text-slate-500">Cette section arrive bientôt.</p>
        </div>
      )}

      {/* Fenêtre Modifier */}
      {edition && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={enregistrerEdition}
            className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-6"
          >
            <h3 className="text-xl font-bold">Modifier le projet</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">Nom du projet
                <input required value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Type
                <select value={edition.type} onChange={(e) => setEdition({ ...edition, type: e.target.value })} className={champ}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">État
                <select value={edition.etat} onChange={(e) => setEdition({ ...edition, etat: e.target.value })} className={champ}>
                  {ETATS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium sm:col-span-2">Lieu
                <input placeholder="Yaoundé, Cameroun" value={edition.lieu} onChange={(e) => setEdition({ ...edition, lieu: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Date de début
                <input type="date" value={edition.date_debut} onChange={(e) => setEdition({ ...edition, date_debut: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Date de fin
                <input type="date" value={edition.date_fin} onChange={(e) => setEdition({ ...edition, date_fin: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Budget prévisionnel (FCFA)
                <input inputMode="decimal" value={edition.budget} onChange={(e) => setEdition({ ...edition, budget: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Coût estimé (FCFA)
                <input inputMode="decimal" value={edition.cout_estime} onChange={(e) => setEdition({ ...edition, cout_estime: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Maître d’ouvrage
                <input value={edition.maitre_ouvrage} onChange={(e) => setEdition({ ...edition, maitre_ouvrage: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium">Responsable
                <input value={edition.responsable} onChange={(e) => setEdition({ ...edition, responsable: e.target.value })} className={champ} />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">Description
                <textarea rows={3} value={edition.description} onChange={(e) => setEdition({ ...edition, description: e.target.value })} className={champ} />
              </label>
            </div>

            {erreurEdition && <p className="text-sm text-red-600">{erreurEdition}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEdition(null)} className="rounded-md px-4 py-2 text-slate-600 hover:bg-slate-100">Annuler</button>
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
