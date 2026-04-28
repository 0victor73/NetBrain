"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const COLORS: { label: string; value: string | null }[] = [
  { label: "Padrão", value: null },
  // Vibrantes
  { label: "Vermelho", value: "#ef4444" },
  { label: "Laranja", value: "#f97316" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Verde", value: "#22c55e" },
  { label: "Ciano", value: "#14b8a6" },
  // Frios
  { label: "Azul", value: "#3b82f6" },
  { label: "Índigo", value: "#6366f1" },
  { label: "Violeta", value: "#8b5cf6" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Rosa escuro", value: "#f43f5e" },
  // Pastéis claros
  { label: "Vermelho pastel", value: "#fca5a5" },
  { label: "Laranja pastel", value: "#fed7aa" },
  { label: "Amarelo pastel", value: "#fef9c3" },
  { label: "Verde pastel", value: "#bbf7d0" },
  { label: "Ciano pastel", value: "#a5f3fc" },
  // Pastéis frios
  { label: "Azul pastel", value: "#bfdbfe" },
  { label: "Violeta pastel", value: "#c4b5fd" },
  { label: "Lilás pastel", value: "#f5d0fe" },
  { label: "Rosa pastel", value: "#fbcfe8" },
  { label: "Coral pastel", value: "#fecdd3" },
  // Neutros
  { label: "Carvão", value: "#374151" },
  { label: "Cinza", value: "#6b7280" },
  { label: "Prata", value: "#9ca3af" },
  { label: "Branco", value: "#f3f4f6" },
];

interface ColorPickerProps {
  currentColor: string | null;
  onChange: (color: string | null) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function ColorPicker({ currentColor, onChange, onClose, triggerRef }: ColorPickerProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pickerWidth = 180;
      // Try to position to the right of trigger, clamp to viewport
      let left = rect.left + rect.width / 2 - pickerWidth / 2;
      if (left + pickerWidth > window.innerWidth - 8) left = window.innerWidth - pickerWidth - 8;
      if (left < 8) left = 8;

      let top = rect.bottom + 6;
      // Clamp bottom — picker is about 180px tall
      if (top + 180 > window.innerHeight - 8) top = rect.top - 186;

      setPos({ top, left });
    }

    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Small delay so the opening click doesn't immediately close the picker
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose, triggerRef]);

  if (!pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={pickerRef}
      style={{ top: pos.top, left: pos.left, width: 180 }}
      className="fixed z-[9999] bg-white dark:bg-[#1e1e1e] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-3"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest mb-2 px-0.5">Cor</p>
      <div className="grid grid-cols-5 gap-1.5">
        {COLORS.map((swatch) => {
          const isSelected = currentColor === swatch.value;
          return (
            <button
              key={swatch.label}
              title={swatch.label}
              onClick={() => { onChange(swatch.value); onClose(); }}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none flex items-center justify-center"
              style={{
                backgroundColor: swatch.value ?? "transparent",
                boxShadow: isSelected
                  ? "0 0 0 2px #8b5cf6, 0 0 0 4px rgba(139,92,246,0.3)"
                  : "0 0 0 1.5px rgba(0,0,0,0.12)",
              }}
            >
              {!swatch.value && (
                <span className="block w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
