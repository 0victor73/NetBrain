"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { checkUsernameExists, saveUserProfile } from "@/lib/db";
import { Camera, User, ArrowRight, Loader2, Check, X } from "lucide-react";

export default function OnboardingPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  // If user already has a username, redirect to dashboard
  useEffect(() => {
    if (userProfile?.username) {
      router.push("/");
    }
  }, [userProfile, router]);

  const handleUsernameChange = async (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);
    
    if (cleaned.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const exists = await checkUsernameExists(cleaned, user?.uid || "");
    setUsernameStatus(exists ? "taken" : "available");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (usernameStatus !== "available") {
      setError("Por favor, escolha um nome de usuário disponível.");
      return;
    }
    if (displayName.trim().length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await saveUserProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim(),
        photoBase64: photoBase64 || undefined,
        photoURL: photoBase64 ? "" : (user.photoURL || "")
      });
      await refreshProfile();
      router.push("/");
    } catch (err: any) {
      setError("Erro ao salvar perfil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao NetBrain!</h1>
          <p className="text-foreground/50 text-sm">Vamos configurar seu perfil para começar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Selection */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center border-4 border-white/10 shadow-xl">
                {(photoBase64 || user.photoURL) ? (
                  <img src={photoBase64 || user.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-violet-600 rounded-full text-white cursor-pointer hover:bg-violet-700 transition-colors shadow-lg">
                <Camera size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <span className="text-xs text-foreground/50 font-medium">Foto de perfil</span>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/50 ml-1">Como quer ser chamado?</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-violet-500/50 transition-colors"
              placeholder="Seu nome real ou apelido"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/50 ml-1">Nome de usuário (@unico)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 font-medium">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-8 pr-10 py-3 text-sm text-foreground outline-none focus:border-violet-500/50 transition-colors"
                placeholder="usuario"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 size={16} className="animate-spin text-violet-500" />}
                {usernameStatus === "available" && <Check size={16} className="text-green-500" />}
                {usernameStatus === "taken" && <X size={16} className="text-red-500" />}
              </div>
            </div>
            {usernameStatus === "taken" && <p className="text-[10px] text-red-500 ml-1">Este usuário já está em uso.</p>}
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            disabled={loading || usernameStatus !== "available"}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                Finalizar Configuração
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
