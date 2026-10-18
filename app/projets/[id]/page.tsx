"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import Geotechnique from "../../../components/Geotechnique";

type Projet = { id: string; nom: string; type: string; etat: string };
type Point = { id: string; nom: string; x: number; y: number; z: number; notes: string | null };

const ONGLETS = ["Vue générale", "Topographie", "Géotechnique"];

export default function FicheProjet() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pret, setPret] = useState(false);
  const [onglet, setOnglet] = useState("Topographie");
  const [f, setF] = useState({ nom: "", x: "", y: "", z: "", notes: "" });
  const [erreur, setErreur] = useState("");

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
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return router.replace("/");
      const { data: p } = await supabase
        .from("projets")
        .select("id, nom, type, etat")
        .eq("id", id)
        .single();
      setProjet(p);
      await chargerPoints();
      setPret(true);
    }
    charger();
  }, [id, router, chargerPoints]);

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

  if (!pret) return <p className="p-6">Chargement…</p>;
  if (!projet) return <p className="p-6">Projet introuvable.</p>;

  const zs = points.map((p) => p.z);
  const zmin = zs.length ? Math.min(...zs) : null;
  const zmax = zs.length ? Math.max(...zs) : null;
  const champ = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <Link href="/dashboard" className="text-sm text-blue-600">← Retour au tableau de bord</Link>
      <h1 className="mt-2 text-3xl font-bold">{projet.nom}</h1>
      <p className="mb-6 text-slate-500">{projet.type} · {projet.etat}</p>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {ONGLETS.map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`px-4 py-2 text-sm ${onglet === o ? "border-b-2 border-blue-600 font-semibold text-blue-600" : "text-slate-500"}`}
          >
            {o}
          </button>
        ))}
      </div>

      {onglet === "Vue générale" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{points.length}</p><p className="text-sm text-slate-500">Points topographiques</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{projet.type}</p><p className="text-sm text-slate-500">Type d’ouvrage</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{projet.etat}</p><p className="text-sm text-slate-500">État</p></div>
        </div>
      )}

      {onglet === "Géotechnique" && (
        <Geotechnique projetId={id} />
      )}

      {onglet === "Topographie" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{points.length}</p><p className="text-sm text-slate-500">Points</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{zmin ?? "—"}</p><p className="text-sm text-slate-500">Altitude min (m)</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{zmax ?? "—"}</p><p className="text-sm text-slate-500">Altitude max (m)</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-3xl font-bold">{zmin !== null && zmax !== null ? (zmax - zmin).toFixed(2) : "—"}</p><p className="text-sm text-slate-500">Dénivelé (m)</p></div>
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
    </div>
  );
}