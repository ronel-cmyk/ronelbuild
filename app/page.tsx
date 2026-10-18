"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Connexion() {
  const router = useRouter();
  const [inscription, setInscription] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    const { error } = inscription
      ? await supabase.auth.signUp({
          email,
          password: mdp,
          options: { data: { nom } },
        })
      : await supabase.auth.signInWithPassword({ email, password: mdp });
    setChargement(false);
    if (error) return setErreur(error.message);
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen">
      <section className="hidden w-1/2 flex-col justify-between bg-gradient-to-b from-blue-800 to-slate-900 p-12 text-white lg:flex">
        <div>
          <h1 className="text-4xl font-bold">Ronelbuild</h1>
          <p className="mt-2 text-blue-200">Collecter · Analyser · Construire demain</p>
        </div>
        <p className="text-2xl leading-snug">
          Une solution complète pour la gestion et l’analyse des données de vos projets de génie civil.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white p-8 text-slate-900">
        <form onSubmit={envoyer} className="w-full max-w-sm space-y-4">
          <h2 className="text-3xl font-bold">{inscription ? "Créer un compte" : "Connexion"}</h2>
          <p className="text-sm text-slate-500">Accédez à votre espace de travail</p>

          {inscription && (
            <label className="block text-sm font-medium">
              Nom complet
              <input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          )}

          <label className="block text-sm font-medium">
            Adresse e-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm font-medium">
            Mot de passe (6 caractères minimum)
            <input
              type="password"
              required
              minLength={6}
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {chargement ? "Patientez…" : inscription ? "Créer mon compte" : "Se connecter"}
          </button>

          <p className="text-center text-sm text-slate-500">
            {inscription ? "Vous avez déjà un compte ?" : "Vous n’avez pas de compte ?"}{" "}
            <button type="button" onClick={() => setInscription(!inscription)} className="text-blue-600">
              {inscription ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}