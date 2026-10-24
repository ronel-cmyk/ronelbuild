"use client";
import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase";

type Cout = { id: string; categorie: string; montant: number };

const PALETTE = ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#94a3b8", "#ef4444", "#14b8a6"];

function abrege(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(".", ",")} Md`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  return n.toLocaleString("fr-FR");
}

export default function RepartitionCouts({ projetId }: { projetId: string }) {
  const [lignes, setLignes] = useState<Cout[]>([]);
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("couts")
      .select("id, categorie, montant")
      .eq("projet_id", projetId)
      .order("created_at");
    setLignes(data ?? []);
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const valeur = parseFloat(montant.replace(/\s/g, "").replace(",", "."));
    if (isNaN(valeur) || valeur < 0) return setErreur("Le montant doit être un nombre positif.");
    const { error } = await supabase
      .from("couts")
      .insert({ projet_id: projetId, categorie: categorie.trim(), montant: valeur });
    if (error) return setErreur(error.message);
    setCategorie("");
    setMontant("");
    await charger();
  }

  async function supprimer(l: Cout) {
    if (!window.confirm(`Supprimer la ligne « ${l.categorie} » ?`)) return;
    await supabase.from("couts").delete().eq("id", l.id);
    await charger();
  }

  const total = lignes.reduce((s, l) => s + Number(l.montant), 0);
  const donnees = lignes.map((l) => ({ name: l.categorie, value: Number(l.montant) }));

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-4 font-semibold">Répartition des coûts</h3>

      {total > 0 ? (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donnees} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none">
                  {donnees.map((d, i) => (
                    <Cell key={d.name + i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">{abrege(total)}</span>
              <span className="text-xs text-slate-500">FCFA</span>
            </div>
          </div>

          <ul className="w-full space-y-2 text-sm">
            {lignes.map((l, i) => (
              <li key={l.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="flex-1 truncate text-slate-600">{l.categorie}</span>
                <span className="font-medium">{Math.round((Number(l.montant) / total) * 100)}%</span>
                <button onClick={() => supprimer(l)} className="text-red-600" aria-label={`Supprimer ${l.categorie}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Aucun coût. Ajoutez une première ligne (ex. Gros œuvre).</p>
      )}

      <form onSubmit={ajouter} className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <input
          required
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          placeholder="Catégorie"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          inputMode="decimal"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Montant (FCFA)"
          className="w-36 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Ajouter
        </button>
      </form>
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
