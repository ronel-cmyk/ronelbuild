"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import Geotechnique from "../../../../components/Geotechnique";

type Projet = { id: string; nom: string; type: string; etat: string; updated_at: string };
type Point = { id: string; nom: string; x: number; y: number; z: number; notes: string | null };
type Edition = { nom: string; type: string; etat: string };

const ONGLETS = [
  "Vue d'ensemble",
  "Topographie",
  "Géotechnique",
  "Hydrologique",
  "Matériaux",
  "Structure",
  "Documents",
  "Rapports",
  "Paramètres",
];
const TYPES = ["Bâtiment", "Route", "Pont", "Hydraulique", "Autre"];
const ETATS = ["En étude", "En cours", "Terminé"];

export default function FicheProjet() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pret, setPret] = useState(false);
  const [onglet, setOnglet] = useState("Vue d'ensemble");
  const [f, setF] = useState({ nom: "", x: "", y: "", z: "", notes: "" });
  const [erreur, setErreur] = useState("");
  const [edition, setEdition] = useState<Edition | null>(null);
  const [erreurEdition, setErreurEdition] = useState("");

  const chargerProjet = useCallback(async () => {
    const { data: p } = await supabase
      .from("projets")
      .select("id, nom, type, etat, updated_at")
      .eq("id", id)
      .single();
    setProjet(p);
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

  async function enregistrerEdition(e: React.FormEvent) {
    e.preventDefault();
    if (!edition) return;
    setErreurEdition("");
    const { error } = await supabase
      .from("projets")
      .update({ ...edition, updated_at: new Date().toISOString() })
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

  const carte = (valeur: string | number, libelle: string) => (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-2xl font-bold">{valeur}</p>
      <p className="text-sm text-slate-500">{libelle}</p>
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
          onClick={() => setEdition({ nom: projet.nom, type: projet.type, etat: projet.etat })}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Modifier
        </button>
      </div>

      {/* Bandeau */}
      <div className="mb-4 rounded-xl bg-[#0b1b3a] p-6 text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{projet.etat}</span>
        <h1 className="mt-3 text-3xl font-bold">{projet.nom}</h1>
        <p className="mt-1 text-sm text-slate-300">
          {projet.type} · Dernière modification le {dateModif}
        </p>
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
            {carte(points.length, "Points topographiques")}
            {carte(projet.type, "Type d’ouvrage")}
            {carte(projet.etat, "État")}
            {carte(dateModif, "Dernière modification")}
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="mb-3 font-semibold">Informations du projet</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Nom</dt><dd className="font-medium">{projet.nom}</dd></div>
              <div><dt className="text-slate-500">Type d’ouvrage</dt><dd className="font-medium">{projet.type}</dd></div>
              <div><dt className="text-slate-500">État</dt><dd className="font-medium">{projet.etat}</dd></div>
              <div><dt className="text-slate-500">Dénivelé relevé</dt><dd className="font-medium">{denivele === "—" ? "—" : `${denivele} m`}</dd></div>
            </dl>
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

      {["Hydrologique", "Matériaux", "Structure", "Documents", "Rapports", "Paramètres"].includes(onglet) && (
        <div className="rounded-xl border bg-white p-6">
          <h3 className="font-semibold">{onglet}</h3>
          <p className="mt-1 text-sm text-slate-500">Cette section arrive bientôt.</p>
        </div>
      )}

      {/* Fenêtre Modifier */}
      {edition && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={enregistrerEdition} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
            <h3 className="text-xl font-bold">Modifier le projet</h3>
            <label className="block text-sm font-medium">Nom du projet
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
