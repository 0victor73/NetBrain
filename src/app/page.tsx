"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, Share2, Search, Library, User, Plus } from "lucide-react";
import clsx from "clsx";
import SettingsPanel from "@/components/SettingsPanel";
import { useSettings } from "@/lib/useSettings";

import { useAuth } from "@/lib/auth-context";
import { LogOut, Loader2, MoreHorizontal, Pencil, Trash2, Menu, X } from "lucide-react";
import { Net, getUserNets, createNet, updateNetDB, deleteNetDB } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("minhas");
  const [showSettings, setShowSettings] = useState(false);
  const [nets, setNets] = useState<Net[]>([]);
  const [loadingNets, setLoadingNets] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dropdown e edição
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingNetId, setEditingNetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const router = useRouter();
  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();
  const { user, userProfile, loading, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchNets = async () => {
      try {
        let userNets = await getUserNets(user.uid);
        if (userNets.length === 0) {
          // Cria a primeira net padrão para o usuário
          const newNet = await createNet(
            user.uid,
            "Minha Primeira Net",
            "Meu mapa mental principal com todas as anotações e conexões sobre tecnologia."
          );
          userNets = [newNet];
        }
        setNets(userNets);
      } catch (error) {
        console.error("Erro ao buscar nets:", error);
      } finally {
        setLoadingNets(false);
      }
    };
    fetchNets();
  }, [user]);

  const handleCreateNewNet = async () => {
    if (!user) return;
    setLoadingNets(true);
    const newNet = await createNet(user.uid, "Nova Net", "Descrição da nova net.");
    setNets((prev) => [newNet, ...prev]);
    setLoadingNets(false);
  };

  if (loading || !settingsLoaded || loadingNets) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground font-medium gap-3">
        <Loader2 className="animate-spin text-violet-500" size={24} />
        Carregando...
      </div>
    );
  }

  if (!user) return null; // O AuthProvider já redireciona para /login

  const handleDeleteNet = async (netId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta Net? Todas as pastas e notas serão perdidas.")) {
      setNets((prev) => prev.filter((n) => n.id !== netId));
      await deleteNetDB(netId);
    }
  };

  const handleStartEdit = (net: Net, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingNetId(net.id);
    setEditTitle(net.title);
    setEditDesc(net.description);
    setOpenDropdownId(null);
  };

  const handleSaveEdit = async (netId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNets((prev) =>
      prev.map((n) => (n.id === netId ? { ...n, title: editTitle, description: editDesc } : n))
    );
    setEditingNetId(null);
    await updateNetDB(netId, { title: editTitle, description: editDesc });
  };

  const handleCardClick = (netId: string) => {
    // Only navigate if we're not currently editing this card
    if (editingNetId !== netId) {
      router.push(`/net/${netId}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden" onClick={() => setOpenDropdownId(null)}>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar do Dashboard */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 h-full bg-gray-50 dark:bg-[#121212] border-r border-black/5 dark:border-white/5 flex flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        <div className="flex flex-col overflow-y-auto">
          {/* Perfil do Usuário */}
          <Link href="/profile" className="p-6 flex items-center gap-4 mb-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center flex-shrink-0 border-2 border-white/10 shadow-lg group-hover:scale-105 transition-transform">
              {(userProfile?.photoBase64 || user.photoURL) ? (
                <img src={userProfile?.photoBase64 || user.photoURL || ""} alt={user.displayName || "User"} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-foreground text-lg leading-tight truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {user.displayName || "Usuário"}
              </span>
              <span className="text-foreground/50 text-xs truncate">
                {userProfile?.username ? `@${userProfile.username}` : user.email}
              </span>
            </div>
          </Link>

          {/* Navegação */}
          <nav className="flex flex-col gap-1 px-4">
            <button
              onClick={() => setActiveTab("minhas")}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left",
                activeTab === "minhas"
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              Minhas Nets
            </button>
            <button
              onClick={() => setActiveTab("compartilhadas")}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left",
                activeTab === "compartilhadas"
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              Compartilhadas comigo
            </button>
            <button
              onClick={() => setActiveTab("encontrar")}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left",
                activeTab === "encontrar"
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              Encontrar Nets
            </button>
          </nav>
        </div>

        {/* Rodapé do Sidebar */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all font-medium text-sm"
          >
            <SettingsIcon size={18} />
            Configurações
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>

      {/* Área Principal */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-white dark:bg-background relative">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(true);
              }}
              className="p-2 -ml-2 rounded-lg text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
            >
              <Menu size={24} />
            </button>
            <img src="/logo.svg" alt="NetBrain Logo" className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md" />
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">NetBrain</h1>
          </div>
          <button
            onClick={handleCreateNewNet}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all font-medium shadow-lg shadow-violet-600/20 text-sm md:text-base"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nova Net</span>
          </button>
        </div>
        
        {/* Grid de Cards (Nets) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nets.map((net) => (
            <div
              key={net.id}
              onClick={() => handleCardClick(net.id)}
              className="relative flex flex-col bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5 p-6 rounded-3xl transition-all hover:scale-[1.02] hover:shadow-xl hover:bg-black/10 dark:hover:bg-white/10 group cursor-pointer aspect-[4/3]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs text-foreground/50 font-medium">
                  {net.noteCount ?? 0} {net.noteCount === 1 ? 'Nota' : 'Notas'}
                </div>
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === net.id ? null : net.id);
                    }}
                    className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdownId === net.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-1 z-50 overflow-hidden">
                      <button
                        onClick={(e) => handleStartEdit(net, e)}
                        className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Pencil size={14} /> Editar Net
                      </button>
                      <button
                        onClick={(e) => handleDeleteNet(net.id, e)}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {editingNetId === net.id ? (
                <div 
                  className="flex flex-col gap-3 h-full"
                  onClick={(e) => e.stopPropagation()} // Prevent card click when editing
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-foreground font-semibold w-full focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Título da Net"
                    autoFocus
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-foreground/80 text-sm w-full h-full resize-none focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Descrição..."
                  />
                  <div className="flex gap-2 justify-end mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNetId(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={(e) => handleSaveEdit(net.id, e)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {net.title}
                  </h3>
                  <p className="text-sm text-foreground/60 leading-relaxed line-clamp-3">
                    {net.description}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </main>

      {showSettings && settingsLoaded && (
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
