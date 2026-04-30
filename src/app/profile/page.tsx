"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, deleteUser } from "firebase/auth";
import { saveUserProfile, UserProfile, checkUsernameExists, deleteAllUserData } from "@/lib/db";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Save, User, Trash2, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoBase64State, setPhotoBase64State] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      setDisplayName(user.displayName || "");
      // Prioriza a foto em Base64 salva no Firestore, depois a do Google
      setPhotoURL(userProfile?.photoBase64 || user.photoURL || "");
      if (userProfile?.username) {
        setUsername(userProfile.username);
      }
    }
  }, [user, userProfile, loading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setPhotoBase64State(dataUrl);
          setPhotoURL(dataUrl); // Preview local
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage("");

    try {
      // Verifica se o username já existe
      const exists = await checkUsernameExists(username, user.uid);
      if (exists) {
        setMessage("Esse nome de usuário já está em uso. Por favor, escolha outro.");
        setIsSaving(false);
        return;
      }

      // Prepara os dados para salvar no Firestore (Username e Foto)
      const profileUpdates: Partial<UserProfile> = { username };
      if (photoBase64State) {
        profileUpdates.photoBase64 = photoBase64State;
      }
      
      // Salva no Firestore
      await saveUserProfile(user.uid, profileUpdates);

      // Atualiza o perfil no Firebase Auth (Apenas Display Name)
      // Não tentamos salvar a imagem em Base64 no Auth (photoURL) pois excede o limite de tamanho.
      // O Firestore já armazenará a imagem e o sistema dará preferência a ela.
      const authUpdates: any = { displayName: displayName };
      
      await updateProfile(user, authUpdates);

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

  const handleDeleteAccount = async () => {
    if (!user || deleteText !== "EXCLUIR MINHA CONTA") return;

    setIsDeleting(true);
    try {
      // 1. Limpar dados do Firestore
      await deleteAllUserData(user.uid);
      
      // 2. Deletar do Auth
      await deleteUser(user);
      
      // 3. Sucesso
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/requires-recent-login") {
        alert("Para sua segurança, esta ação requer um login recente. Por favor, saia e entre novamente antes de excluir sua conta.");
      } else {
        alert("Erro ao excluir conta: " + error.message);
      }
    } finally {
      setIsDeleting(false);
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

          {/* Excluir Conta */}
          <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10">
            <h3 className="text-foreground/80 font-bold mb-2 flex items-center gap-2 text-lg">
              Excluir conta
            </h3>
            <p className="text-sm text-foreground/50 mb-6">
              Se você decidir sair do NetBrain permanentemente, pode apagar sua conta e todos os seus dados aqui.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-foreground/40 hover:text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-transparent hover:border-red-500/20"
            >
              Solicitar exclusão de conta
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Deleção */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-3xl shadow-2xl p-8 relative border border-black/10 dark:border-white/10 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-foreground transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-black/5 dark:bg-white/5 text-foreground/40 rounded-full flex items-center justify-center mb-6">
                <Trash2 size={24} />
              </div>
              
              <h2 className="text-xl font-bold mb-2">Excluir sua conta?</h2>
              <p className="text-foreground/50 text-sm mb-8">
                Isso removerá permanentemente todos os seus mapas mentais, notas e configurações do NetBrain.
              </p>

              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                    Digite <span className="text-foreground/60 select-all font-mono">deletar minha conta</span> para confirmar
                  </label>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-center text-sm font-medium outline-none focus:border-violet-500/30 transition-colors"
                    placeholder="Confirme o texto acima"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteText.toLowerCase() !== "deletar minha conta"}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    {isDeleting ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Confirmar Exclusão"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-3 text-foreground/50 hover:text-foreground font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
