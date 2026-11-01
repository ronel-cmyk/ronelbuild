"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PageParametres() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [messageProfil, setMessageProfil] = useState<{ texte: string; ok: boolean } | null>(null);

  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [messageMdp, setMessageMdp] = useState<{ texte: string; ok: boolean } | null>(null);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      const { data: profil } = await supabase.from("profiles").select("nom").eq("id", data.user.id).single();
      setNom(profil?.nom ?? "");
    }
    charger();
  }, []);

  async function enregistrerProfil(e: React.FormEvent) {
    e.preventDefault();
    setMessageProfil(null);
    const { error } = await supabase.from("profiles").update({ nom: nom.trim() }).eq("id", userId);
    if (error) return setMessageProfil({ texte: error.message, ok: false });
    setMessageProfil({ texte: "Nom enregistré. Rechargez la page pour le voir dans l’en-tête.", ok: true });
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setMessageMdp(null);
    if (mdp.length < 6) return setMessageMdp({ texte: "Le mot de passe doit contenir au moins 6 caractères.", ok: false });
    if (mdp !== confirmation) return setMessageMdp({ texte: "Les deux mots de passe ne sont pas identiques.", ok: false });
    const { error } = await supabase.auth.updateUser({ password: mdp });
    if (error) return setMessageMdp({ texte: error.message, ok: false });
    setMdp("");
    setConfirmation("");
    setMessageMdp({ texte: "Mot de passe modifié.", ok: true });
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const champ = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";
  const message = (m: { texte: string; ok: boolean } | null) =>
    m && <p className={`text-sm ${m.ok ? "text-green-600" : "text-red-600"}`}>{m.texte}</p>;

  return (
    <main className="max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-slate-500">Gérez votre profil et la sécurité de votre compte.</p>
      </div>

      <form onSubmit={enregistrerProfil} className="space-y-4 rounded-xl border bg-white p-5">
        <h3 className="font-semibold">Profil</h3>
        <label className="block text-sm font-medium">
          Adresse e-mail
          <input value={email} readOnly className={`${champ} bg-slate-50 text-slate-500`} />
        </label>
        <label className="block text-sm font-medium">
          Nom affiché
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
        </label>
        {message(messageProfil)}
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Enregistrer
        </button>
      </form>

      <form onSubmit={changerMotDePasse} className="space-y-4 rounded-xl border bg-white p-5">
        <h3 className="font-semibold">Mot de passe</h3>
        <label className="block text-sm font-medium">
          Nouveau mot de passe
          <input type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} className={champ} />
        </label>
        <label className="block text-sm font-medium">
          Confirmer le mot de passe
          <input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={champ} />
        </label>
        {message(messageMdp)}
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Modifier le mot de passe
        </button>
      </form>

      <div className="space-y-3 rounded-xl border bg-white p-5">
        <h3 className="font-semibold">Session</h3>
        <p className="text-sm text-slate-500">Vous êtes connecté avec {email || "votre compte"}.</p>
        <button onClick={deconnexion} className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          Se déconnecter
        </button>
      </div>

      <p className="text-xs text-slate-400">Ronelbuild · gestion de projets de génie civil</p>
    </main>
  );
}
