"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Inscription() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function creerCompte(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setInfo("");
    if (motDePasse.length < 6) return setErreur("Le mot de passe doit contenir au moins 6 caractères.");
    if (motDePasse !== confirmation) return setErreur("Les deux mots de passe ne sont pas identiques.");

    setEnvoi(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: motDePasse,
      options: { data: { nom: nom.trim() } },
    });
    setEnvoi(false);

    if (error) return setErreur(error.message);

    // Compte créé et déjà connecté (confirmation par e-mail désactivée)
    if (data.session && data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, nom: nom.trim() });
      return router.replace("/dashboard");
    }

    // Confirmation par e-mail activée
    setInfo("Compte créé. Ouvrez le message de confirmation envoyé à votre adresse e-mail, puis connectez-vous.");
  }

  const champ = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
      <form onSubmit={creerCompte} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-sm text-slate-500">Vos projets et vos données restent privés : chaque compte voit uniquement les siens.</p>
        </div>

        <label className="block text-sm font-medium">
          Nom complet
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className={champ} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium">
          Adresse e-mail
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">
          Mot de passe
          <input required type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={champ} autoComplete="new-password" />
        </label>
        <label className="block text-sm font-medium">
          Confirmer le mot de passe
          <input required type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={champ} autoComplete="new-password" />
        </label>

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        {info && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{info}</p>}

        <button
          type="submit"
          disabled={envoi}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {envoi ? "Création…" : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Vous avez déjà un compte ?{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </main>
  );
}
