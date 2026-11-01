"use client";

import { useState, type FormEvent } from "react";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // L'authentification Supabase sera conservée ici
    // et devra être reliée à ton système existant.
    console.log("Tentative de connexion pour :", email);
  };

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
        {/* Voile bleu */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#031b49]/95 via-[#06377c]/65 to-[#06265d]/25" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#031b49]/65 via-transparent to-[#031b49]/20" />

        {/* Contenu */}
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
              Une solution complète pour la gestion et l’analyse des données de vos{" "}
              <span className="text-blue-400">projets de génie civil.</span>
            </h2>

            {/* AVANTAGES */}
            <div className="mt-10 flex max-w-lg flex-col gap-2">

              <div className="flex items-center gap-5 rounded-xl border border-white/15 bg-blue-900/35 px-5 py-3 backdrop-blur-md transition hover:bg-blue-800/50">
                <span className="text-3xl text-blue-400">▥</span>
                <span className="text-sm font-medium text-white">
                  Suivi intelligent des projets
                </span>
              </div>

              <div className="flex items-center gap-5 rounded-xl border border-white/15 bg-blue-900/35 px-5 py-3 backdrop-blur-md transition hover:bg-blue-800/50">
                <span className="text-3xl text-blue-400">✓</span>
                <span className="text-sm font-medium text-white">
                  Données fiables et sécurisées
                </span>
              </div>

              <div className="flex items-center gap-5 rounded-xl border border-white/15 bg-blue-900/35 px-5 py-3 backdrop-blur-md transition hover:bg-blue-800/50">
                <span className="text-3xl text-blue-400">ϟ</span>
                <span className="text-sm font-medium text-white">
                  Décisions éclairées
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
          PANNEAU DROIT : CONNEXION
      ================================= */}

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fcfdff] px-6 py-12 lg:w-[34%]">

        {/* Décoration supérieure */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-2xl" />

        {/* Décoration inférieure */}
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-blue-100/70 blur-2xl" />

        <div className="relative z-10 w-full max-w-[430px]">

          {/* Logo mobile */}
          <div className="mb-12 flex items-center justify-center gap-3 lg:hidden">
            <span className="text-4xl text-blue-600">◈</span>
            <h1 className="text-3xl font-extrabold text-[#09275e]">
              Ronel<span className="text-blue-600">Build</span>
            </h1>
          </div>

          {/* ICONE CASQUE */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="66"
                height="66"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 17h20" />
                <path d="M4 17v-4a8 8 0 0 1 16 0v4" />
                <path d="M9 5v7" />
                <path d="M15 5v7" />
                <path d="M12 3v9" />
                <path d="M2 17v1a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-1" />
              </svg>
            </div>
          </div>

          {/* TITRE */}
          <div className="mb-11 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#09275e]">
              Connexion
            </h2>

            <p className="mt-4 text-base text-slate-600">
              Accédez à votre espace de travail
            </p>
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* EMAIL */}
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-blue-700">
                ✉
              </span>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse e-mail"
                required
                className="h-[58px] w-full rounded-xl border border-slate-300 bg-white pl-14 pr-4 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-500 hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* MOT DE PASSE */}
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-blue-700">
                🔒
              </span>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe (8 caractères minimum)"
                minLength={8}
                required
                className="h-[58px] w-full rounded-xl border border-slate-300 bg-white pl-14 pr-14 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-500 hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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

            {/* BOUTON */}
            <button
              type="submit"
              className="flex h-[62px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#087cf5] to-[#064cc2] text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
              </svg>

              Se connecter
            </button>

          </form>

          {/* INSCRIPTION */}
          <div className="mt-7 text-center text-sm text-slate-600">
            Vous n'avez pas de compte ?{" "}
            <button
              type="button"
              onClick={() => {
                alert("Page de création de compte à venir.");
              }}
              className="font-bold text-blue-700 transition hover:text-blue-900"
            >
              Créer un compte →
            </button>
          </div>

          {/* SECURITE */}
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Connexion sécurisée
          </div>

          {/* VERSION */}
          <div className="mt-20 text-center">
            <p className="text-sm font-medium text-slate-500">
              RonelBuild v1.0.0
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Construire un avenir plus solide
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}