"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Sondage = {
  id: string; nom: string; profondeur: number | null; nappe: number | null;
  cohesion: number | null; phi: number | null; gamma: number | null;
  assise: number | null; largeur: number | null; tassement: number | null;
};
type Couche = { id: string; sondage_id: string; de: number; a: number; nature: string };

const NATURES = ["Remblai", "Argile", "Limon", "Sable", "Gravier", "Roche"];
const COULEURS: Record<string, string> = {
  Remblai: "#c9a46c", Argile: "#6f93c9", Limon: "#b8a98a",
  Sable: "#e6c27a", Gravier: "#8a8f98", Roche: "#4b5563",
};
const champ = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";
const num = (v: string) => (v.trim() === "" ? null : parseFloat(v.replace(",", ".")));

function analyser(s: Sondage) {
  const alertes: string[] = [];
  let qadm: number | null = null;
  const { cohesion: c, phi, gamma, assise: D, largeur: B } = s;
  if (c !== null && phi !== null && gamma !== null && D !== null && B !== null) {
    const a = (phi * Math.PI) / 180;
    const Nq = Math.exp(Math.PI * Math.tan(a)) * Math.tan(Math.PI / 4 + a / 2) ** 2;
    const Nc = phi > 0 ? (Nq - 1) / Math.tan(a) : 5.14;
    const Ng = 2 * (Nq + 1) * Math.tan(a);
    const qu = c * Nc + gamma * D * Nq + 0.5 * gamma * B * Ng;
    qadm = qu / 3;
    if (qadm < 100) alertes.push("Sol faible : envisager des fondations profondes ou une amélioration du sol.");
    else if (qadm < 250) alertes.push("Semelles superficielles possibles ; dimensionnement à vérifier.");
  }
  if (s.nappe !== null && D !== null && B !== null && s.nappe < D + B)
    alertes.push("Nappe dans la zone d’influence des fondations : prévoir pompage et étanchéité.");
  if (s.tassement !== null && s.tassement > 25)
    alertes.push("Tassement supérieur à 25 mm : vérifier les tassements différentiels.");
  const conforme = qadm !== null && qadm >= 100 && s.tassement !== null ? s.tassement <= 25 && !(s.nappe !== null && D !== null && B !== null && s.nappe < D + B) : false;
  return { qadm, alertes, conforme };
}

function CarteSondage({ s, couches, recharger }: { s: Sondage; couches: Couche[]; recharger: () => void }) {
  const [c, setC] = useState({ de: "", a: "", nature: NATURES[0] });
  const [erreur, setErreur] = useState("");
  const { qadm, alertes, conforme } = analyser(s);
  const prof = Math.max(s.profondeur ?? 0, ...couches.map((x) => x.a), 1);

  async function ajouterCouche(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const de = num(c.de), a = num(c.a);
    if (de === null || a === null || isNaN(de) || isNaN(a)) return setErreur("Profondeurs invalides.");
    if (a <= de) return setErreur("La profondeur de fin doit dépasser celle de début.");
    const { error } = await supabase.from("couches").insert({ sondage_id: s.id, de, a, nature: c.nature });
    if (error) return setErreur(error.message);
    setC({ de: String(a), a: "", nature: c.nature });
    recharger();
  }

  async function supprimerCouche(id: string) {
    await supabase.from("couches").delete().eq("id", id);
    recharger();
  }

  async function supprimerSondage() {
    if (!window.confirm(`Supprimer le sondage « ${s.nom} » ?`)) return;
    await supabase.from("sondages").delete().eq("id", s.id);
    recharger();
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Sondage {s.nom}</h3>
        <button onClick={supprimerSondage} className="text-sm text-red-600">Supprimer</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{qadm !== null ? `${Math.round(qadm)} kPa` : "—"}</p>
              <p className="text-sm text-slate-500">Portance admissible estimée</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{s.tassement !== null ? `${s.tassement} mm` : "—"}</p>
              <p className="text-sm text-slate-500">Tassement estimé</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{s.nappe !== null ? `${s.nappe} m` : "—"}</p>
              <p className="text-sm text-slate-500">Niveau de la nappe</p>
            </div>
            <div className="rounded-lg border p-3">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${conforme ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                {conforme ? "Conforme" : "À vérifier"}
              </span>
              <p className="mt-2 text-sm text-slate-500">Évaluation globale</p>
            </div>
          </div>

          {qadm === null && (
            <p className="text-sm text-slate-500">Renseignez c, φ, γ, la profondeur d’assise et la largeur de semelle pour calculer la portance.</p>
          )}
          {alertes.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="mb-1 text-sm font-semibold text-orange-800">Alertes</p>
              <ul className="list-disc pl-5 text-sm text-orange-800">
                {alertes.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-slate-400">
            Calcul : capacité portante d’une semelle filante, coefficient de sécurité 3. Valeur indicative de pré-dimensionnement, à confirmer par une étude géotechnique.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Profil géotechnique</p>
          <div className="flex gap-3">
            <div className="relative h-64 w-20 overflow-hidden rounded border border-slate-300 bg-slate-100">
              {couches.map((x) => (
                <div
                  key={x.id}
                  title={`${x.nature} ${x.de}–${x.a} m`}
                  style={{ position: "absolute", left: 0, right: 0, top: `${(x.de / prof) * 100}%`, height: `${((x.a - x.de) / prof) * 100}%`, background: COULEURS[x.nature] }}
                />
              ))}
              {s.nappe !== null && (
                <div style={{ position: "absolute", left: 0, right: 0, top: `${Math.min((s.nappe / prof) * 100, 100)}%`, borderTop: "3px dashed #1d4ed8" }} />
              )}
            </div>
            <ul className="flex-1 space-y-1 text-sm">
              {couches.length === 0 && <li className="text-slate-500">Aucune couche. Ajoutez-en ci-dessous.</li>}
              {couches.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="mr-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: COULEURS[x.nature] }} />
                    {x.de}–{x.a} m : {x.nature}
                  </span>
                  <button onClick={() => supprimerCouche(x.id)} className="text-xs text-red-600">Retirer</button>
                </li>
              ))}
              {s.nappe !== null && <li className="text-blue-700">- - - Nappe à {s.nappe} m</li>}
            </ul>
          </div>

          <form onSubmit={ajouterCouche} className="mt-4 grid grid-cols-3 gap-2">
            <label className="text-xs font-medium">De (m)
              <input required inputMode="decimal" value={c.de} onChange={(e) => setC({ ...c, de: e.target.value })} className={champ} />
            </label>
            <label className="text-xs font-medium">À (m)
              <input required inputMode="decimal" value={c.a} onChange={(e) => setC({ ...c, a: e.target.value })} className={champ} />
            </label>
            <label className="text-xs font-medium">Nature
              <select value={c.nature} onChange={(e) => setC({ ...c, nature: e.target.value })} className={champ}>
                {NATURES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <div className="col-span-3">
              {erreur && <p className="mb-1 text-sm text-red-600">{erreur}</p>}
              <button type="submit" className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">+ Ajouter la couche</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Geotechnique({ projetId }: { projetId: string }) {
  const [sondages, setSondages] = useState<Sondage[]>([]);
  const [couches, setCouches] = useState<Couche[]>([]);
  const [f, setF] = useState({ nom: "", profondeur: "", nappe: "", cohesion: "", phi: "", gamma: "", assise: "", largeur: "", tassement: "" });
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    const { data: s } = await supabase.from("sondages").select("*").eq("projet_id", projetId).order("created_at");
    setSondages(s ?? []);
    const ids = (s ?? []).map((x) => x.id);
    if (ids.length === 0) return setCouches([]);
    const { data: c } = await supabase.from("couches").select("*").in("sondage_id", ids).order("de");
    setCouches(c ?? []);
  }, [projetId]);

  useEffect(() => { charger(); }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const { error } = await supabase.from("sondages").insert({
      projet_id: projetId, nom: f.nom,
      profondeur: num(f.profondeur), nappe: num(f.nappe), cohesion: num(f.cohesion),
      phi: num(f.phi), gamma: num(f.gamma), assise: num(f.assise),
      largeur: num(f.largeur), tassement: num(f.tassement),
    });
    if (error) return setErreur(error.message);
    setF({ nom: "", profondeur: "", nappe: "", cohesion: "", phi: "", gamma: "", assise: "", largeur: "", tassement: "" });
    charger();
  }

  const champs: [keyof typeof f, string][] = [
    ["profondeur", "Profondeur totale (m)"], ["nappe", "Niveau de nappe (m)"],
    ["cohesion", "Cohésion c (kPa)"], ["phi", "Angle de frottement φ (°)"],
    ["gamma", "Poids volumique γ (kN/m³)"], ["assise", "Profondeur d’assise (m)"],
    ["largeur", "Largeur de semelle (m)"], ["tassement", "Tassement estimé (mm)"],
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={ajouter} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium sm:col-span-2 lg:col-span-4">Nom du sondage
          <input required placeholder="S-001" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} className={champ} />
        </label>
        {champs.map(([k, l]) => (
          <label key={k} className="text-sm font-medium">{l}
            <input inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={champ} />
          </label>
        ))}
        <div className="sm:col-span-2 lg:col-span-4">
          {erreur && <p className="mb-2 text-sm text-red-600">{erreur}</p>}
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">+ Ajouter le sondage</button>
        </div>
      </form>

      {sondages.length === 0 && <p className="rounded-xl border bg-white p-6 text-center text-slate-500">Aucun sondage. Ajoutez le premier avec le formulaire ci-dessus.</p>}
      {sondages.map((s) => (
        <CarteSondage key={s.id} s={s} couches={couches.filter((c) => c.sondage_id === s.id)} recharger={charger} />
      ))}
    </div>
  );
}