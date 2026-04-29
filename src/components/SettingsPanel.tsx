"use client";

import { Settings, Theme, EditorMode, EditorFont, FontSize } from "@/lib/types";
import { X, Monitor, Sun, Moon, Type, AlignLeft, ToggleLeft, ToggleRight } from "lucide-react";
import clsx from "clsx";

interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  onClose: () => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 mt-6 first:mt-0">
      {children}
    </h3>
  );
}

function OptionGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
            value === opt.value
              ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground/70 hover:text-foreground hover:border-violet-400/50"
          )}
        >
          {opt.icon && <span className="opacity-80">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  label,
  description,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-2 cursor-pointer group"
      onClick={() => onChange(!value)}
    >
      <div>
        <p className="text-sm font-medium text-foreground group-hover:text-violet-500 transition-colors">
          {label}
        </p>
        {description && <p className="text-xs text-foreground/40">{description}</p>}
      </div>
      <div
        className={clsx(
          "w-10 h-6 rounded-full transition-colors flex items-center px-1",
          value ? "bg-violet-600" : "bg-black/10 dark:bg-white/10"
        )}
      >
        <div
          className={clsx(
            "w-4 h-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-4" : "translate-x-0"
          )}
        />
      </div>
    </div>
  );
}

export default function SettingsPanel({ settings, updateSettings, onClose }: SettingsPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm sm:w-96 bg-white dark:bg-[#161616] border-l border-black/10 dark:border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">

          <SectionTitle>Aparência</SectionTitle>
          <OptionGroup<Theme>
            value={settings.theme}
            onChange={(v) => updateSettings({ theme: v })}
            options={[
              { value: "system", label: "Sistema", icon: <Monitor size={14} /> },
              { value: "light", label: "Claro", icon: <Sun size={14} /> },
              { value: "dark", label: "Escuro", icon: <Moon size={14} /> },
            ]}
          />

          <SectionTitle>Editor</SectionTitle>
          <p className="text-xs text-foreground/50 mb-2">Modo padrão ao abrir uma nota</p>
          <OptionGroup<EditorMode>
            value={settings.defaultEditorMode}
            onChange={(v) => updateSettings({ defaultEditorMode: v })}
            options={[
              { value: "edit", label: "Editar" },
              { value: "split", label: "Dividido" },
              { value: "preview", label: "Visualizar" },
            ]}
          />

          <div className="mt-4">
            <p className="text-xs text-foreground/50 mb-2">Fonte do editor</p>
            <OptionGroup<EditorFont>
              value={settings.editorFont}
              onChange={(v) => updateSettings({ editorFont: v })}
              options={[
                { value: "mono", label: "Mono", icon: <Type size={14} /> },
                { value: "sans", label: "Sans-serif", icon: <AlignLeft size={14} /> },
                { value: "serif", label: "Serif", icon: <AlignLeft size={14} /> },
              ]}
            />
          </div>

          <div className="mt-4">
            <p className="text-xs text-foreground/50 mb-2">Tamanho da fonte</p>
            <OptionGroup<FontSize>
              value={settings.fontSize}
              onChange={(v) => updateSettings({ fontSize: v })}
              options={[
                { value: "sm", label: "Pequena" },
                { value: "base", label: "Média" },
                { value: "lg", label: "Grande" },
              ]}
            />
          </div>

          <SectionTitle>Comportamento</SectionTitle>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            <Toggle
              value={settings.spellCheck}
              onChange={(v) => updateSettings({ spellCheck: v })}
              label="Verificação ortográfica"
              description="Destacar erros de digitação no editor"
            />
            <Toggle
              value={settings.lineNumbers}
              onChange={(v) => updateSettings({ lineNumbers: v })}
              label="Números de linha"
              description="Mostrar numeração de linhas no editor"
            />
          </div>

          <SectionTitle>Sobre</SectionTitle>
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 text-sm text-foreground/60 space-y-1">
            <div className="flex justify-between">
              <span>Versão</span>
              <span className="font-mono">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Notas salvas</span>
              <span className="font-mono text-violet-500">no dispositivo</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
