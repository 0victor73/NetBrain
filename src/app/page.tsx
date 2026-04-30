"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, Share2, Search, Library, User, Plus } from "lucide-react";
import clsx from "clsx";
import SettingsPanel from "@/components/SettingsPanel";
import { useSettings } from "@/lib/useSettings";

import { useAuth } from "@/lib/auth-context";
import { LogOut, Loader2, MoreHorizontal, Pencil, Trash2, Menu, X, Share2 as ShareIcon, Shield, Edit3, Eye, Download, Upload } from "lucide-react";
import { Net, AccessRole, getUserNets, createNet, updateNetDB, deleteNetDB, getSharedNets, getPublicNets, getUserByUsername, NetExportData, exportNet, importNet } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("minhas");
  const [showSettings, setShowSettings] = useState(false);
  const [nets, setNets] = useState<Net[]>([]);
  const [sharedNets, setSharedNets] = useState<Net[]>([]);
  const [publicNets, setPublicNets] = useState<Net[]>([]);
  const [loadingNets, setLoadingNets] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Compartilhamento
  const [sharingNet, setSharingNet] = useState<Net | null>(null);
  const [shareUsernameInput, setShareUsernameInput] = useState("");
  const [shareRoleInput, setShareRoleInput] = useState<AccessRole>("editor");
  const [isSavingShare, setIsSavingShare] = useState(false);

  // Dropdown e edição
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingNetId, setEditingNetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [isNewNetDropdownOpen, setIsNewNetDropdownOpen] = useState(false);

  const router = useRouter();
  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();
  const { user, userProfile, loading, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchNets = async () => {
      setLoadingNets(true);
      try {
        if (activeTab === "minhas") {
          let userNets = await getUserNets(user.uid);
          if (userNets.length === 0) {
            const newNet = await createNet(
              user.uid,
              "Minha Primeira Net",
              "Meu mapa mental principal com todas as anotações e conexões sobre tecnologia.",
              {
                name: user.displayName || "Usuário",
                username: userProfile?.username || "usuario",
                photoURL: userProfile?.photoBase64 || user.photoURL || ""
              }
            );
            userNets = [newNet];
          }
          setNets(userNets);
        } else if (activeTab === "compartilhadas") {
          const sNets = await getSharedNets(user.uid);
          setSharedNets(sNets);
        } else if (activeTab === "encontrar") {
          const pNets = await getPublicNets();
          setPublicNets(pNets);
        }
      } catch (error) {
        console.error("Erro ao buscar nets:", error);
      } finally {
        setLoadingNets(false);
      }
    };
    fetchNets();
  }, [user, activeTab, userProfile?.username]);

  const handleCreateNewNet = async () => {
    if (!user) return;
    setLoadingNets(true);
    const newNet = await createNet(
      user.uid,
      "Nova Net",
      "Descrição da nova net.",
      {
        name: user.displayName || "Usuário",
        username: userProfile?.username || "usuario",
        photoURL: userProfile?.photoBase64 || user.photoURL || ""
      }
    );
    setNets((prev) => [newNet, ...prev]);
    setLoadingNets(false);
  };

  const filteredPublicNets = publicNets.filter(net =>
    net.owner?.username.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
    net.title.toLowerCase().includes(publicSearchQuery.toLowerCase())
  );

  if (loading || !settingsLoaded || loadingNets) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground font-medium gap-3">
        <Loader2 className="animate-spin text-violet-500" size={24} />
        Carregando...
      </div>
    );
  }

  if (!user) return null; // O AuthProvider já redireciona para /login

  const handleSaveShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingNet) return;
    setIsSavingShare(true);
    try {
      const usernameToAdd = shareUsernameInput.trim().replace('@', '');

      let newSharedWith = sharingNet.sharedWith || [];
      let newSharedUsers = sharingNet.sharedUsers || [];

      if (usernameToAdd) {
        const userToAdd = await getUserByUsername(usernameToAdd);
        if (!userToAdd) {
          alert(`Usuário @${usernameToAdd} não encontrado.`);
          setIsSavingShare(false);
          return;
        }

        if (!newSharedWith.includes(userToAdd.uid)) {
          newSharedWith = [...newSharedWith, userToAdd.uid];
          newSharedUsers = [...newSharedUsers, { uid: userToAdd.uid, username: userToAdd.profile.username, role: shareRoleInput }];
        } else {
          // Update role if already shared
          newSharedUsers = newSharedUsers.map(u => u.uid === userToAdd.uid ? { ...u, role: shareRoleInput } : u);
        }
      }

      const updates = {
        sharedWith: newSharedWith,
        sharedUsers: newSharedUsers,
        isPublic: sharingNet.isPublic
      };

      await updateNetDB(sharingNet.id, updates);

      // Atualiza estado local
      setNets(prev => prev.map(n => n.id === sharingNet.id ? { ...n, ...updates } : n));
      setSharingNet({ ...sharingNet, ...updates });
      setShareUsernameInput("");
      setShareRoleInput("editor");
    } catch (error) {
      console.error("Erro ao compartilhar net", error);
    } finally {
      setIsSavingShare(false);
    }
  };

  const handleTogglePublic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sharingNet) return;
    const isPublic = e.target.checked;
    setSharingNet({ ...sharingNet, isPublic });
    await updateNetDB(sharingNet.id, { isPublic });
    setNets(prev => prev.map(n => n.id === sharingNet.id ? { ...n, isPublic } : n));
  };

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

  const handleExportNet = async (netId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdownId(null);
    try {
      const data = await exportNet(netId);
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_net.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar net", error);
      alert("Falha ao exportar a Net.");
    }
  };

  const handleImportNet = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as NetExportData;

        // Basic validation
        if (!data.net || !Array.isArray(data.notes) || !Array.isArray(data.folders)) {
          throw new Error("Formato de arquivo inválido");
        }

        setLoadingNets(true);
        const importedNet = await importNet(user.uid, data, {
          name: user.displayName || "Usuário",
          username: userProfile?.username || "usuario",
          photoURL: userProfile?.photoBase64 || user.photoURL || ""
        });

        setNets(prev => [importedNet, ...prev]);
        setActiveTab("minhas");
      } catch (error) {
        console.error("Erro ao importar net:", error);
        alert("Falha ao importar o arquivo. Verifique se o formato está correto.");
      } finally {
        setLoadingNets(false);
        // Reset input
        event.target.value = "";
      }
    };
    reader.readAsText(file);
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
                {userProfile?.displayName || user.displayName || "Usuário"}
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
            <img src="/logo.svg" alt="NetBrain Logo" className="w-10 h-10 md:w-14 md:h-14 drop-shadow-md" />
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">NetBrain</h1>
          </div>
          <div className="flex items-center gap-2 relative">
            {activeTab === "minhas" && (
              <div className="relative">
                <button
                  onClick={() => setIsNewNetDropdownOpen(!isNewNetDropdownOpen)}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all font-medium shadow-lg shadow-violet-600/20 text-sm md:text-base"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Nova Net</span>
                </button>

                {isNewNetDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsNewNetDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-1 z-[70] overflow-hidden">
                      <button
                        onClick={() => { handleCreateNewNet(); setIsNewNetDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Edit3 size={14} /> Criar do zero
                      </button>
                      <label className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer">
                        <Upload size={14} /> Importar JSON
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => { handleImportNet(e); setIsNewNetDropdownOpen(false); }}
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
            {activeTab === "minhas" ? "Minhas Nets" : activeTab === "compartilhadas" ? "Compartilhadas" : "Encontrar Nets"}
          </h2>
          <p className="text-foreground/50 text-sm md:text-base mt-2">
            {activeTab === "minhas"
              ? "Gerencie seus mapas mentais e conexões."
              : activeTab === "compartilhadas"
                ? "Nets que outras pessoas compartilharam com você."
                : "Explore mapas mentais públicos da comunidade."}
          </p>
        </div>

        {activeTab === "encontrar" && (
          <div className="mb-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por @usuário ou título..."
              value={publicSearchQuery}
              onChange={(e) => setPublicSearchQuery(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-violet-500 transition-all text-foreground"
            />
          </div>
        )}

        {/* Grid de Cards (Nets) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "minhas" && nets.map((net) => (
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
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSharingNet(net); setOpenDropdownId(null); setShareUsernameInput(""); }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <ShareIcon size={14} /> Compartilhar
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

          {activeTab === "encontrar" && filteredPublicNets.length === 0 && !loadingNets && (
            <div className="col-span-full py-20 text-center bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
              <Search className="mx-auto text-foreground/20 mb-4" size={48} />
              <p className="text-foreground/40 text-lg">Nenhuma Net encontrada para sua pesquisa.</p>
              <button
                onClick={() => setPublicSearchQuery("")}
                className="mt-4 text-violet-500 hover:underline text-sm font-medium"
              >
                Limpar pesquisa
              </button>
            </div>
          )}

          {(activeTab === "compartilhadas"
            ? sharedNets
            : activeTab === "encontrar"
              ? filteredPublicNets
              : []
          ).map((net) => (
            <div
              key={net.id}
              onClick={() => handleCardClick(net.id)}
              className="relative flex flex-col bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5 p-6 rounded-3xl transition-all hover:scale-[1.02] hover:shadow-xl hover:bg-black/10 dark:hover:bg-white/10 group cursor-pointer aspect-[4/3]"
            >
              {/* Card Header (Owner Details) */}
              {net.owner && (
                <div className="flex items-center gap-3 mb-6">
                  {net.owner.photoURL ? (
                    <img src={net.owner.photoURL} alt={net.owner.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground leading-tight">{net.owner.name}</span>
                    <span className="text-xs text-foreground/50 leading-tight">@{net.owner.username}</span>
                  </div>
                </div>
              )}

              {/* Card Body (Title and Description) */}
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {net.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed line-clamp-3">
                  {net.description}
                </p>
              </div>

              {/* Card Footer (Note Count) */}
              <div className="mt-4 text-xs text-foreground/50 font-medium">
                {net.noteCount?.toLocaleString('pt-BR') ?? 0} {net.noteCount === 1 ? 'Nota' : 'Notas'}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Compartilhamento */}
      {sharingNet && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
              <button onClick={() => setSharingNet(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground">
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-2">Compartilhar "{sharingNet.title}"</h2>
              <p className="text-sm text-foreground/60 mb-6">Escolha quem pode visualizar e interagir com este mapa mental.</p>

              <div className="mb-6 bg-black/5 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Acesso Público</h4>
                  <p className="text-xs text-foreground/60">Qualquer pessoa pode encontrar esta Net na aba "Encontrar Nets".</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={sharingNet.isPublic || false} onChange={handleTogglePublic} className="sr-only peer" />
                  <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer dark:bg-white/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Export Option inside Share Modal */}
              <div className="mb-6 p-4 rounded-xl border border-dashed border-black/10 dark:border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Exportar Json</h4>
                    <p className="text-xs text-foreground/60">Baixe uma cópia desta Net em formato JSON.</p>
                  </div>
                  <button
                    onClick={(e) => handleExportNet(sharingNet.id, sharingNet.title, e)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-bold transition-all"
                  >
                    <Download size={14} /> Exportar
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveShare} className="flex flex-col gap-3">
                <label className="text-sm font-semibold">Compartilhar com usuário</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="@nomedeusuario"
                    value={shareUsernameInput}
                    onChange={(e) => setShareUsernameInput(e.target.value)}
                    className="flex-1 bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-violet-500 min-w-0"
                  />
                  <select
                    value={shareRoleInput}
                    onChange={(e) => setShareRoleInput(e.target.value as AccessRole)}
                    className="bg-white dark:bg-[#2a2a2a] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>
                <button type="submit" disabled={isSavingShare || !shareUsernameInput.trim()} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl transition-colors disabled:opacity-50 font-medium text-sm">
                  {isSavingShare ? "Adicionando..." : "Adicionar"}
                </button>
              </form>

              {sharingNet.sharedUsers && sharingNet.sharedUsers.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3">Compartilhado com:</h4>
                  <div className="flex flex-col gap-2">
                    {sharingNet.sharedUsers.map(u => {
                      const roleConfig = {
                        admin: { label: "Administrador", icon: <Shield size={11} />, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                        editor: { label: "Editor", icon: <Edit3 size={11} />, cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                        viewer: { label: "Visualizador", icon: <Eye size={11} />, cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
                      }[u.role ?? "viewer"];
                      return (
                        <div key={u.uid} className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
                          <span className="text-sm font-medium">@{u.username}</span>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.cls}`}>
                              {roleConfig.icon} {roleConfig.label}
                            </span>
                            <button onClick={async () => {
                              const updatedWith = sharingNet.sharedWith!.filter(uid => uid !== u.uid);
                              const updatedUsers = sharingNet.sharedUsers!.filter(user => user.uid !== u.uid);
                              const updates = { sharedWith: updatedWith, sharedUsers: updatedUsers };
                              await updateNetDB(sharingNet.id, updates);
                              setSharingNet({ ...sharingNet, ...updates });
                              setNets(prev => prev.map(n => n.id === sharingNet.id ? { ...n, ...updates } : n));
                            }} className="text-foreground/30 hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}

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
