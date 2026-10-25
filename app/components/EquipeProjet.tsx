"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type Membre = { id: string; nom: string; role: string | null; statut: string };

export default function EquipeProjet({
  projetId,
  onNombre,
}: {
  projetId: string;
  onNombre?: (n: number) => void;
}) {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("");
  const [erreur, setErreur] = useState("");

  // Référence vers la fonction du parent pour éviter de recharger en boucle
  const rappel = useRef(onNombre);
  useEffect(() => {
    rappel.current = onNombre;
  });

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("membres_projet")
      .select("id, nom, role, statut")
      .eq("projet_id", projetId)
      .order("created_at");
    const liste: Membre[] = data ?? [];
    setMembres(liste);
    rappel.current?.(liste.length);
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const { error } = await supabase
      .from("membres_projet")
      .insert({ projet_id: projetId, nom: nom.trim(), role: role.trim() || null });
    if (error) return setErreur(error.message);
    setNom("");
    setRole("");
    await charger();
  }

  async function basculer(m: Membre) {
    const statut = m.statut === "Actif" ? "Absent" : "Actif";
    const { error } = await supabase.from("membres_projet").update({ statut }).eq("id", m.id);
    if (error) setErreur(error.message);
    await charger();
  }

  async function supprimer(m: Membre) {
    if (!window.confirm(`Retirer « ${m.nom} » de l’équipe ?`)) return;
    await supabase.from("membres_projet").delete().eq("id", m.id);
    await charger();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-semibold">Équipe du projet</h3>
        <span className="text-xs text-slate-500">
          {membres.length} membre{membres.length > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="space-y-3">
        {membres.map((m) => (
          <li key={m.id} className="flex items-center gap-3 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {(m.nom[0] ?? "?").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.nom}</p>
              <p className="truncate text-xs text-slate-500">{m.role || "Rôle non précisé"}</p>
            </div>
            <button
              onClick={() => basculer(m)}
              title="Cliquer pour changer le statut"
              className={`rounded-full px-2 py-1 text-xs ${
                m.statut === "Actif" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {m.statut}
            </button>
            <button onClick={() => supprimer(m)} className="text-red-600" aria-label={`Retirer ${m.nom}`}>
              ×
            </button>
          </li>
        ))}
        {membres.length === 0 && (
          <p className="text-sm text-slate-500">Aucun membre. Ajoutez le premier ci-dessous.</p>
        )}
      </ul>

      <form onSubmit={ajouter} className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du membre"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Rôle (ex. Géotechnicien)"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Ajouter
        </button>
      </form>
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
