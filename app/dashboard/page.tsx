"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import GraphiqueEtats from "../components/GraphiqueEtats";

type Projet = { id: string; nom: string; type: string; etat: string; updated_at: string };
type Formulaire = { id?: string; nom: string; type: string; etat: string };

const TYPES = ["Bâtiment", "Route", "Pont", "Hydraulique", "Autre"];
const ETATS = ["En étude", "En cours", "Terminé"];
const couleurs: Record<string, string> = {
  "En cours": "bg-orange-100 text-orange-700",
  "En étude": "bg-purple-100 text-purple-700",
  Terminé: "bg-green-100 text-green-700",
};
const couleursTypes: Record<string, string> = {
  Bâtiment: "bg-blue-500",
  Route: "bg-purple-400",
  Pont: "bg-red-400",
  Hydraulique: "bg-orange-400",
  Autre: "bg-blue-600",
};

export default function Dashboard() {
  const [nom, setNom] = useState("");
  const [projets, setProjets] = useState<Projet[]>([]);
  const [alertes, setAlertes] = useState(0);
  const [recherche, setRecherche] = useState("");
  const [form, setForm] = useState<Formulaire | null>(null);
  const [erreur, setErreur] = useState("");

  const chargerProjets = useCallback(async () => {
    const { data } = await supabase
      .from("projets")
      .select("*")
      .order("updated_at", { ascending: false });
    const liste: Projet[] = data ?? [];
    setProjets(liste);
    // Alerte = projet "En étude" non modifié depuis plus de 30 jours
    const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    setAlertes(
      liste.filter((p) => p.etat === "En étude" && new Date(p.updated_at).getTime() < limite).length
    );
  }, []);

  useEffect(() => {
    async function charger() {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const { data: profil } = await supabase
        .from("profiles")
        .select("nom")
        .eq("id", s.session.user.id)
        .single();
      setNom(profil?.nom ?? s.session.user.email ?? "");
      await chargerProjets();
    }
    charger();
  }, [chargerProjets]);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErreur("");
    const valeurs = {
      nom: form.nom,
      type: form.type,
      etat: form.etat,
      updated_at: new Date().toISOString(),
    };
    const { error } = form.id
      ? await supabase.from("projets").update(valeurs).eq("id", form.id)
      : await supabase.from("projets").insert(valeurs);
    if (error) return setErreur(error.message);
    setForm(null);
    await chargerProjets();
  }

  async function supprimer(p: Projet) {
    if (!window.confirm(`Supprimer le projet « ${p.nom} » ?`)) return;
    const { error } = await supabase.from("projets").delete().eq("id", p.id);
    if (error) alert(error.message);
    else await chargerProjets();
  }

  const stats = [
    { n: projets.length, l: "Projets totaux", icone: "📁", fond: "bg-blue-100" },
    { n: projets.filter((p) => p.etat === "En cours").length, l: "Projets actifs", icone: "📅", fond: "bg-green-100" },
    { n: projets.filter((p) => p.etat === "Terminé").length, l: "Projets terminés", icone: "✅", fond: "bg-purple-100" },
    { n: alertes, l: "Alertes", icone: "⚠️", fond: "bg-red-100" },
  ];

  const projetsAffiches = projets.filter((p) =>
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const parType = TYPES.map((t) => ({ t, n: projets.filter((p) => p.type === t).length }));
  const maxType = Math.max(1, ...parType.map((x) => x.n));

  return (
    <>
      <main className="p-6">
        <h2 className="text-2xl font-bold">Bonjour, {nom} ! 👋</h2>
        <p className="mb-6 text-slate-500">Voici l’état de vos projets.</p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.fond}`}>
                  {s.icone}
                </span>
                <p className="text-3xl font-bold">{s.n}</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="overflow-x-auto rounded-xl border bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Projets récents</h3>
              <div className="flex items-center gap-2">
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-40 rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setForm({ nom: "", type: TYPES[0], etat: ETATS[0] })}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Nouveau projet
                </button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Nom du projet</th>
                  <th className="font-medium">Type</th>
                  <th className="font-medium">État</th>
                  <th className="font-medium">Dernière modification</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projetsAffiches.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-3 font-medium">
                      <Link href={`dashboard/projets/${p.id}`} className="text-blue-600 hover:underline">
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
                    <td className="space-x-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setForm({ id: p.id, nom: p.nom, type: p.type, etat: p.etat })}
                        className="text-blue-600"
                      >
                        Modifier
                      </button>
                      <button onClick={() => supprimer(p)} className="text-red-600">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projetsAffiches.length === 0 && (
              <p className="py-6 text-center text-slate-500">
                {projets.length === 0
                  ? "Aucun projet. Cliquez sur « Nouveau projet » pour commencer."
                  : "Aucun projet ne correspond à votre recherche."}
              </p>
            )}
          </div>

          <div className="space-y-6">
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
          </div>
        </div>
      </main>

      {form && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={enregistrer} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
            <h3 className="text-xl font-bold">{form.id ? "Modifier le projet" : "Nouveau projet"}</h3>

            <label className="block text-sm font-medium">
              Nom du projet
              <input
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium">
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              État
              <select
                value={form.etat}
                onChange={(e) => setForm({ ...form, etat: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {ETATS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>

            {erreur && <p className="text-sm text-red-600">{erreur}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-md px-4 py-2 text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
