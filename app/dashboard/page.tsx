"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
const menu = ["Dashboard", "Projets", "Analyses", "Données", "Rapports", "Documents"];

export default function Dashboard() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [projets, setProjets] = useState<Projet[]>([]);
  const [pret, setPret] = useState(false);
  const [form, setForm] = useState<Formulaire | null>(null);
  const [erreur, setErreur] = useState("");

  const chargerProjets = useCallback(async () => {
    const { data } = await supabase
      .from("projets")
      .select("*")
      .order("updated_at", { ascending: false });
    setProjets(data ?? []);
  }, []);

  useEffect(() => {
    async function charger() {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return router.replace("/");
      const { data: profil } = await supabase
        .from("profiles")
        .select("nom")
        .eq("id", s.session.user.id)
        .single();
      setNom(profil?.nom ?? s.session.user.email ?? "");
      await chargerProjets();
      setPret(true);
    }
    charger();
  }, [router, chargerProjets]);

  async function deconnexion() {
    await supabase.auth.signOut();
    router.replace("/");
  }

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

  if (!pret) return <p className="p-6">Chargement…</p>;

  const stats = [
    { n: projets.length, l: "Projets totaux" },
    { n: projets.filter((p) => p.etat === "En cours").length, l: "Projets actifs" },
    { n: projets.filter((p) => p.etat === "Terminé").length, l: "Projets terminés" },
    { n: 0, l: "Alertes" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-56 flex-col bg-slate-900 p-4 text-slate-300 md:flex">
        <h1 className="mb-6 text-xl font-bold text-white">Ronelbuild</h1>
        <nav className="space-y-1">
          {menu.map((m, i) => (
            <a key={m} href="#" className={`block rounded-md px-3 py-2 text-sm ${i === 0 ? "bg-blue-600 text-white" : "hover:bg-slate-800"}`}>
              {m}
            </a>
          ))}
        </nav>
        <button onClick={deconnexion} className="mt-auto rounded-md px-3 py-2 text-left text-sm hover:bg-slate-800">
          Se déconnecter
        </button>
      </aside>

      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold">Bonjour, {nom} ! 👋</h2>
        <p className="mb-6 text-slate-500">Voici l’état de vos projets.</p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl border bg-white p-4">
              <p className="text-3xl font-bold">{s.n}</p>
              <p className="text-sm text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Projets récents</h3>
            <button
              onClick={() => setForm({ nom: "", type: TYPES[0], etat: ETATS[0] })}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Nouveau projet
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Nom du projet</th>
                <th>Type</th>
                <th>État</th>
                <th>Dernière modification</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projets.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-3 font-medium">
  <Link href={`/projets/${p.id}`} className="text-blue-600 hover:underline">{p.nom}</Link>
</td>
                  <td>{p.type}</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs ${couleurs[p.etat] ?? ""}`}>{p.etat}</span>
                  </td>
                  <td>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</td>
                  <td className="space-x-3 text-right">
                    <button onClick={() => setForm({ id: p.id, nom: p.nom, type: p.type, etat: p.etat })} className="text-blue-600">
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
          <GraphiqueEtats projets={projets} />
          {projets.length === 0 && (
            <p className="py-6 text-center text-slate-500">Aucun projet. Cliquez sur « Nouveau projet » pour commencer.</p>
          )}
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
              <button type="button" onClick={() => setForm(null)} className="rounded-md px-4 py-2 text-slate-600 hover:bg-slate-100">
                Annuler
              </button>
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}