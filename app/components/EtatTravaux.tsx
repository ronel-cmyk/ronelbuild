"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type Phase = { id: string; nom: string; avancement: number };

const couleur = (n: number) =>
  n >= 100 ? "bg-green-500" : n >= 60 ? "bg-blue-500" : n >= 30 ? "bg-orange-400" : "bg-purple-500";

// Avancement global = moyenne des avancements des phases (0 s'il n'y a aucune phase)
const moyenne = (liste: Phase[]) =>
  liste.length ? Math.round(liste.reduce((s, p) => s + p.avancement, 0) / liste.length) : 0;

export default function EtatTravaux({
  projetId,
  onAvancement,
}: {
  projetId: string;
  onAvancement?: (n: number) => void;
}) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [nom, setNom] = useState("");
  const [pct, setPct] = useState("0");
  const [erreur, setErreur] = useState("");

  // On garde la fonction du parent dans une référence pour éviter de recharger en boucle
  const rappel = useRef(onAvancement);
  useEffect(() => {
    rappel.current = onAvancement;
  });

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("phases")
      .select("id, nom, avancement")
      .eq("projet_id", projetId)
      .order("created_at");
    const liste: Phase[] = data ?? [];
    setPhases(liste);
    rappel.current?.(moyenne(liste));
    return liste;
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Enregistre la moyenne dans le projet pour que toutes les pages affichent la même valeur
  async function synchroniser(liste: Phase[]) {
    const { error } = await supabase
      .from("projets")
      .update({ avancement: moyenne(liste) })
      .eq("id", projetId);
    if (error) setErreur(error.message);
  }

  const borner = (v: string) => Math.min(100, Math.max(0, Math.round(parseFloat(v.replace(",", ".")) || 0)));

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const { error } = await supabase
      .from("phases")
      .insert({ projet_id: projetId, nom: nom.trim(), avancement: borner(pct) });
    if (error) return setErreur(error.message);
    setNom("");
    setPct("0");
    await synchroniser(await charger());
  }

  async function changer(p: Phase, valeur: string) {
    const n = borner(valeur);
    if (n === p.avancement) return;
    const { error } = await supabase.from("phases").update({ avancement: n }).eq("id", p.id);
    if (error) setErreur(error.message);
    await synchroniser(await charger());
  }

  async function supprimer(p: Phase) {
    if (!window.confirm(`Supprimer la phase « ${p.nom} » ?`)) return;
    await supabase.from("phases").delete().eq("id", p.id);
    await synchroniser(await charger());
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-semibold">État des travaux</h3>
        <span className="text-xs text-slate-500">Moyenne : {moyenne(phases)}%</span>
      </div>

      <div className="space-y-3">
        {phases.map((p) => (
          <div key={p.id} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-slate-600" title={p.nom}>{p.nom}</span>
            <div className="h-3 flex-1 rounded-full bg-slate-100">
              <div className={`h-3 rounded-full ${couleur(p.avancement)}`} style={{ width: `${p.avancement}%` }} />
            </div>
            <input
              key={`${p.id}-${p.avancement}`}
              type="number"
              min={0}
              max={100}
              defaultValue={p.avancement}
              onBlur={(e) => changer(p, e.target.value)}
              className="w-16 rounded border border-slate-300 px-1 py-0.5 text-right"
              aria-label={`Avancement de ${p.nom}`}
            />
            <span className="text-slate-400">%</span>
            <button onClick={() => supprimer(p)} className="text-red-600" aria-label={`Supprimer ${p.nom}`}>
              ×
            </button>
          </div>
        ))}
        {phases.length === 0 && (
          <p className="text-sm text-slate-500">
            Aucune phase. Ajoutez la première ci-dessous (ex. Terrassements) : l’avancement global se calcule à partir des phases.
          </p>
        )}
      </div>

      <form onSubmit={ajouter} className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la phase"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
          aria-label="Avancement en pourcentage"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Ajouter
        </button>
      </form>
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
