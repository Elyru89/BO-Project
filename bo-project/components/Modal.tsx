"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  title, onClose, children, size = "md"
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bo-card w-full ${widths[size]} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-bo-border flex-shrink-0">
          <h2 className="font-bold text-bo-text text-base">{title}</h2>
          <button onClick={onClose} className="text-bo-subtle hover:text-bo-text transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
