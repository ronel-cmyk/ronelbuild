"use client";
import { useCallback, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase";

type Releve = { id: string; date: string; avancement: number; cout_pct: number | null; delai_pct: number | null };

const libelleDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export default function EvolutionProjet({
  projetId,
  avancement,
  coutPct,
  delaiPct,
}: {
  projetId: string;
  avancement: number;
  coutPct: number | null;
  delaiPct: number | null;
}) {
  const [releves, setReleves] = useState<Releve[]>([]);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("releves_projet")
      .select("id, date, avancement, cout_pct, delai_pct")
      .eq("projet_id", projetId)
      .order("date");
    setReleves(data ?? []);
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function enregistrer() {
    setErreur("");
    setMessage("");
    const aujourdhui = new Date().toLocaleDateString("fr-CA"); // format AAAA-MM-JJ
    const { error } = await supabase.from("releves_projet").upsert(
      { projet_id: projetId, date: aujourdhui, avancement, cout_pct: coutPct, delai_pct: delaiPct },
      { onConflict: "projet_id,date" }
    );
    if (error) return setErreur(error.message);
    setMessage("Relevé du jour enregistré.");
    await charger();
  }

  async function annulerDernier() {
    const dernier = releves[releves.length - 1];
    if (!dernier) return;
    if (!window.confirm(`Supprimer le relevé du ${libelleDate(dernier.date)} ?`)) return;
    await supabase.from("releves_projet").delete().eq("id", dernier.id);
    setMessage("");
    await charger();
  }

  const donnees = releves.map((r) => ({
    date: libelleDate(r.date),
    "Avancement global": r.avancement,
    Coût: r.cout_pct,
    Délai: r.delai_pct,
  }));

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Évolution du projet</h3>
        <div className="flex items-center gap-3">
          {releves.length > 0 && (
            <button onClick={annulerDernier} className="text-xs text-slate-500 hover:underline">
              Annuler le dernier relevé
            </button>
          )}
          <button
            onClick={enregistrer}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Enregistrer un relevé
          </button>
        </div>
      </div>

      {releves.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Aucun relevé. Cliquez sur « Enregistrer un relevé » pour noter l’état du jour ; la courbe se dessine dès le deuxième relevé.
        </p>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={donnees} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="Avancement global" stroke="#3b82f6" strokeWidth={2} dot connectNulls />
              <Line type="monotone" dataKey="Coût" stroke="#22c55e" strokeWidth={2} dot connectNulls />
              <Line type="monotone" dataKey="Délai" stroke="#f97316" strokeWidth={2} dot connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
