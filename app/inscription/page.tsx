"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Inscription() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur("");
    setInfo("");

    if (password.length < 8) return setErreur("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmation) return setErreur("Les deux mots de passe ne sont pas identiques.");

    setEnvoi(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nom: nom.trim() } },
    });
    setEnvoi(false);

    if (error) {
      if (error.message.includes("already registered")) {
        return setErreur("Un compte existe déjà avec cette adresse e-mail.");
      }
      if (error.message.toLowerCase().includes("rate limit")) {
        return setErreur("Trop de tentatives. Patientez quelques minutes puis réessayez.");
      }
      return setErreur(error.message);
    }

    // Avec la confirmation par e-mail, une adresse déjà utilisée renvoie un utilisateur sans identité
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return setErreur("Un compte existe déjà avec cette adresse e-mail.");
    }

    // Compte créé et déjà connecté (confirmation par e-mail désactivée)
    if (data.session && data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, nom: nom.trim() });
      return router.replace("/dashboard");
    }

    // Confirmation par e-mail activée
    setInfo("Compte créé. Ouvrez le message de confirmation envoyé à votre adresse e-mail, puis connectez-vous.");
  };

  const champ =
    "h-[58px] w-full rounded-xl border border-slate-300 bg-white pl-14 pr-4 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-500 hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
  const icone = "absolute left-5 top-1/2 -translate-y-1/2 text-xl text-blue-700";

  return (
    <main className="flex min-h-screen w-full overflow-x-hidden bg-white">

      {/* ================================
          PANNEAU GAUCHE : PRESENTATION
      ================================= */}

      <section
        className="relative hidden min-h-screen overflow-hidden bg-[#06265d] bg-cover bg-center lg:flex lg:w-[66%]"
        style={{
          backgroundImage: "url('/Ronelbuild-login.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#031b49]/95 via-[#06377c]/65 to-[#06265d]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#031b49]/65 via-transparent to-[#031b49]/20" />

        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-10 py-10 xl:px-16 xl:py-12">

          {/* LOGO */}
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/20 text-5xl text-blue-300">
                ◈
              </div>

              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl">
                  Ronel<span className="text-blue-400">Build</span>
                </h1>

                <p className="mt-1 text-sm tracking-wide text-blue-100">
                  Collecter <span className="mx-2">•</span>
                  Analyser <span className="mx-2">•</span>
                  Construire demain
                </p>
              </div>
            </div>
          </div>

          {/* PRESENTATION */}
          <div className="my-10 max-w-2xl">
            <h2 className="text-4xl font-extrabold leading-[1.18] tracking-tight text-white xl:text-[40px]">
              Créez votre espace et pilotez vos{" "}
              <span className="text-blue-400">projets de génie civil.</span>
            </h2>

            <div className="mt-10 flex max-w-lg flex-col gap-2">
              <div className="flex items-center gap-5 rounded-xl border border-white/15 bg-blue-900/35 px-5 py-3 backdrop-blur-md transition hover:bg-blue-800/50">
                <span className="text-3xl text-blue-400">▥</span>
                <span className="text-sm font-medium text-white">
                  Vos propres projets, budgets et équipes
                </span>
              </div>

              <div className="flex items-center gap-5 rounded-xl border border-white/15 bg-blue-900/35 px-5 py-3 backdrop-blur-md transition hover:bg-blue-800/50">
                <span className="text-3xl text-blue-400">✓</span>
                <span className="text-sm font-medium text-white">
                  Données privées : chaque compte voit uniquement les siennes
                </span>
              </div>

              <div className="flex items-center gap-5 rounded-xl border border-white/15 bg-blue-900/35 px-5 py-3 backdrop-blur-md transition hover:bg-blue-800/50">
                <span className="text-3xl text-blue-400">ϟ</span>
                <span className="text-sm font-medium text-white">
                  Analyses et rapports générés automatiquement
                </span>
              </div>
            </div>
          </div>

          {/* PIED DE PAGE GAUCHE */}
          <div className="border-t border-white/30 pt-4">
            <p className="text-sm italic tracking-wide text-blue-100">
              Des données fiables pour des infrastructures durables
            </p>
          </div>

        </div>
      </section>


      {/* ================================
          PANNEAU DROIT : INSCRIPTION
      ================================= */}

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fcfdff] px-6 py-12 lg:w-[34%]">

        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-blue-100/70 blur-2xl" />

        <div className="relative z-10 w-full max-w-[430px]">

          {/* Logo mobile */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <span className="text-4xl text-blue-600">◈</span>
            <h1 className="text-3xl font-extrabold text-[#09275e]">
              Ronel<span className="text-blue-600">Build</span>
            </h1>
          </div>

          {/* ICONE UTILISATEUR */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10" cy="8" r="4" />
                <path d="M2 21c0-4 3.6-7 8-7" />
                <path d="M18 14v6" />
                <path d="M15 17h6" />
              </svg>
            </div>
          </div>

          {/* TITRE */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#09275e]">
              Créer un compte
            </h2>

            <p className="mt-4 text-base text-slate-600">
              Rejoignez votre espace de travail
            </p>
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleSignup} className="space-y-4">

            {/* NOM */}
            <div className="relative">
              <span className={icone}>👤</span>
              <input
                id="nom"
                name="nom"
                type="text"
                autoComplete="name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom complet"
                required
                className={champ}
              />
            </div>

            {/* EMAIL */}
            <div className="relative">
              <span className={icone}>✉</span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse e-mail"
                required
                className={champ}
              />
            </div>

            {/* MOT DE PASSE */}
            <div className="relative">
              <span className={icone}>🔒</span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe (8 caractères minimum)"
                required
                className={`${champ} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-lg text-slate-500 transition hover:text-blue-600"
              >
                {showPassword ? "◉" : "◎"}
              </button>
            </div>

            {/* CONFIRMATION */}
            <div className="relative">
              <span className={icone}>🔒</span>
              <input
                id="confirmation"
                name="confirmation"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="Confirmer le mot de passe"
                required
                className={champ}
              />
            </div>

            {/* MESSAGES */}
            {erreur && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                {erreur}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
                {info}
              </p>
            )}

            {/* BOUTON */}
            <button
              type="submit"
              disabled={envoi}
              className="flex h-[62px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#087cf5] to-[#064cc2] text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {envoi ? "Création…" : "Créer mon compte"}
            </button>

          </form>

          {/* CONNEXION */}
          <div className="mt-7 text-center text-sm text-slate-600">
            Vous avez déjà un compte ?{" "}
            <Link href="/" className="font-bold text-blue-700 transition hover:text-blue-900">
              Se connecter →
            </Link>
          </div>

          {/* SECURITE */}
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Vos données restent privées
          </div>

          {/* VERSION */}
          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-500">RonelBuild v1.0.0</p>
            <p className="mt-2 text-xs text-slate-400">Construire un avenir plus solide</p>
          </div>

        </div>
      </section>

    </main>
  );
}
