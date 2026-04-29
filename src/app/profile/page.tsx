"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/db";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Save, User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      if (userProfile?.username) {
        setUsername(userProfile.username);
      }
    }
  }, [user, userProfile, loading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPhotoURL(URL.createObjectURL(file)); // Preview local
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage("");

    try {
      let finalPhotoURL = user.photoURL;

      // Se o usuário selecionou uma nova imagem, fazemos o upload pro Storage
      if (imageFile) {
        const storageRef = ref(storage, `profiles/${user.uid}/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      // Atualiza o perfil no Firebase Auth
      await updateProfile(user, {
        displayName: displayName,
        photoURL: finalPhotoURL,
      });

      // Salva o username customizado no Firestore
      await saveUserProfile(user.uid, { username });

      // Atualiza o contexto local
      await refreshProfile();

      setMessage("Perfil salvo com sucesso!");
    } catch (error: any) {
      console.error(error);
      setMessage("Erro ao salvar perfil: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground gap-3">
        <Loader2 className="animate-spin text-violet-500" size={24} />
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative">
      <div className="w-full max-w-2xl">
        {/* Header / Voltar */}
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-8 font-medium">
          <ArrowLeft size={20} />
          Voltar para Dashboard
        </Link>

        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-foreground mb-8">Meu Perfil</h1>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center sm:flex-row gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center border-4 border-background shadow-xl">
                  {photoURL ? (
                    <img src={photoURL} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-white" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg transition-transform group-hover:scale-110"
                >
                  <Camera size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-foreground">Foto de Perfil</h3>
                <p className="text-sm text-foreground/50 mt-1 max-w-xs">
                  Recomendado usar uma imagem quadrada de no mínimo 256x256px.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80 ml-1">Nome</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="Seu nome..."
                />
              </div>

              {/* Nome de Usuário (@) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80 ml-1">Nome de Usuário</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-medium">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-4 py-3 text-foreground outline-none focus:border-violet-500/50 transition-colors"
                    placeholder="usuario"
                  />
                </div>
                <p className="text-xs text-foreground/40 ml-1">Apenas letras minúsculas, números e underlines (_).</p>
              </div>

              {/* Email (Apenas leitura) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80 ml-1">E-mail</label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground/50 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mensagens de Sucesso/Erro */}
            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Erro') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {message}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
