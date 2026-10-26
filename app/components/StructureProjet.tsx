"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Element = {
  id: string;
  nom: string;
  type: string;
  niveau: string | null;
  quantite: number;
  longueur: number | null;
  largeur: number | null;
  hauteur: number | null;
  classe_beton: string | null;
  etat: string;
};

const TYPES = ["Semelle", "Poteau", "Poutre", "Dalle", "Voile", "Mur", "Fondation", "Autre"];
const ETATS = ["À faire", "En cours", "Terminé"];
const couleursEtat: Record<string, string> = {
  "À faire": "bg-slate-100 text-slate-600",
  "En cours": "bg-orange-100 text-orange-700",
  Terminé: "bg-green-100 text-green-700",
};

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const nombre = (v: string) => (v.trim() === "" ? null : parseFloat(v.replace(/\s/g, "").replace(",", ".")));
// Volume en m³ = quantité × longueur × largeur × hauteur (0 si une dimension manque)
const volume = (e: Element) =>
  e.longueur !== null && e.largeur !== null && e.hauteur !== null ? e.quantite * e.longueur * e.largeur * e.hauteur : 0;

export default function StructureProjet({ projetId }: { projetId: string }) {
  const [liste, setListe] = useState<Element[]>([]);
  const [f, setF] = useState({ nom: "", type: "Poteau", niveau: "", quantite: "1", l: "", la: "", h: "", beton: "" });
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("elements_structure")
      .select("id, nom, type, niveau, quantite, longueur, largeur, hauteur, classe_beton, etat")
      .eq("projet_id", projetId)
      .order("created_at");
    const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    setListe(
      (data ?? []).map((e) => ({
        ...e,
        quantite: Number(e.quantite),
        longueur: n(e.longueur),
        largeur: n(e.largeur),
        hauteur: n(e.hauteur),
      }))
    );
  }, [projetId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const quantite = Math.round(nombre(f.quantite) ?? NaN);
    const dims = [nombre(f.l), nombre(f.la), nombre(f.h)];
    if (isNaN(quantite) || quantite < 1) return setErreur("La quantité doit être un entier d’au moins 1.");
    if (dims.some((d) => d !== null && (isNaN(d) || d <= 0))) return setErreur("Les dimensions doivent être des nombres positifs (en mètres).");
    const { error } = await supabase.from("elements_structure").insert({
      projet_id: projetId,
      nom: f.nom.trim(),
      type: f.type,
      niveau: f.niveau.trim() || null,
      quantite,
      longueur: dims[0],
      largeur: dims[1],
      hauteur: dims[2],
      classe_beton: f.beton.trim() || null,
    });
    if (error) return setErreur(error.message);
    setF({ ...f, nom: "", niveau: "", quantite: "1", l: "", la: "", h: "" });
    await charger();
  }

  async function changerEtat(el: Element, etat: string) {
    const { error } = await supabase.from("elements_structure").update({ etat }).eq("id", el.id);
    if (error) setErreur(error.message);
    await charger();
  }

  async function supprimer(el: Element) {
    if (!window.confirm(`Supprimer « ${el.nom} » ?`)) return;
    await supabase.from("elements_structure").delete().eq("id", el.id);
    await charger();
  }

  const total = liste.reduce((s, e) => s + e.quantite, 0);
  const volumeTotal = liste.reduce((s, e) => s + volume(e), 0);
  const termines = liste.filter((e) => e.etat === "Terminé").length;
  const pctTermines = liste.length ? Math.round((termines / liste.length) * 100) : 0;
  const champ = "rounded-md border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm text-slate-500">Éléments (en quantité)</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{fmt(volumeTotal)} m³</p>
          <p className="text-sm text-slate-500">Volume de béton</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{termines}/{liste.length}</p>
          <p className="text-sm text-slate-500">Lignes terminées</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{pctTermines}%</p>
          <p className="text-sm text-slate-500">Structure réalisée</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${pctTermines}%` }} />
          </div>
        </div>
      </div>

      <form onSubmit={ajouter} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input required placeholder="Élément (ex. Poteaux P1 à P8)" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} className={`${champ} lg:col-span-2`} />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={champ} aria-label="Type d’élément">
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input placeholder="Niveau (RDC, R+1…)" value={f.niveau} onChange={(e) => setF({ ...f, niveau: e.target.value })} className={champ} />
        <input required inputMode="numeric" placeholder="Quantité" value={f.quantite} onChange={(e) => setF({ ...f, quantite: e.target.value })} className={champ} />
        <input inputMode="decimal" placeholder="Longueur (m)" value={f.l} onChange={(e) => setF({ ...f, l: e.target.value })} className={champ} />
        <input inputMode="decimal" placeholder="Largeur (m)" value={f.la} onChange={(e) => setF({ ...f, la: e.target.value })} className={champ} />
        <input inputMode="decimal" placeholder="Hauteur / épaisseur (m)" value={f.h} onChange={(e) => setF({ ...f, h: e.target.value })} className={champ} />
        <input placeholder="Béton (ex. C25/30)" value={f.beton} onChange={(e) => setF({ ...f, beton: e.target.value })} className={`${champ} lg:col-span-2`} />
        <div className="sm:col-span-2 lg:col-span-4">
          {erreur && <p className="mb-2 text-sm text-red-600">{erreur}</p>}
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            + Ajouter l’élément
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2 font-medium">Élément</th>
              <th className="font-medium">Type</th>
              <th className="font-medium">Niveau</th>
              <th className="font-medium">Qté</th>
              <th className="font-medium">Dimensions (m)</th>
              <th className="font-medium">Béton</th>
              <th className="font-medium">Volume</th>
              <th className="font-medium">État</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((el) => (
              <tr key={el.id} className="border-t">
                <td className="py-3 font-medium">{el.nom}</td>
                <td>{el.type}</td>
                <td>{el.niveau || "—"}</td>
                <td>{el.quantite}</td>
                <td>
                  {el.longueur !== null && el.largeur !== null && el.hauteur !== null
                    ? `${fmt(el.longueur)} × ${fmt(el.largeur)} × ${fmt(el.hauteur)}`
                    : "—"}
                </td>
                <td>{el.classe_beton || "—"}</td>
                <td>{volume(el) > 0 ? `${fmt(volume(el))} m³` : "—"}</td>
                <td>
                  <select
                    value={el.etat}
                    onChange={(e) => changerEtat(el, e.target.value)}
                    className={`rounded-full px-2 py-1 text-xs ${couleursEtat[el.etat] ?? ""}`}
                    aria-label={`État de ${el.nom}`}
                  >
                    {ETATS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td className="text-right">
                  <button onClick={() => supprimer(el)} className="text-red-600" aria-label={`Supprimer ${el.nom}`}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {liste.length === 0 && (
          <p className="py-6 text-center text-slate-500">Aucun élément. Ajoutez le premier avec le formulaire ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
