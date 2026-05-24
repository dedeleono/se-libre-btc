
'use client'

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Pencil } from "lucide-react";
import clsx from "clsx";
import { addMineducId } from "@/lib/actions";

function EditableMineducId({
  initialValue,
  studentId,
}: {
  initialValue: string;
  studentId: string;
}) {
  const [input, setInput] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error" | "editing">(
    "idle"
  );
  const [isPending, startTransition] = useTransition();

  // Floating label logic
  const isActive = status === "editing" || input.length > 0;

  const handleSave = async () => {
    setStatus("saving");
    try {
      await addMineducId(studentId, input);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="relative w-full max-w-md pr-4 py-4">
      {/* Floating label and edit icon */}
      <div className="flex items-center mb-1">
        <label
          className={clsx(
            "text-sm font-medium text-muted-foreground absolute left-2 top-8 z-10 origin-[0] text-gray-500 pointer-events-none transition-all duration-200",
            isActive
              ? "-translate-y-5 scale-90 bg-white px-1 text-primary font-semibold"
              : "text-base"
          )}
        >
          Código MINEDUC
        </label>
        {/* Edit icon appears on hover or when not editing */}
        {status !== "editing" && (
          <button
            aria-label="Editar código MINEDUC"
            className="ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 rounded-full p-1 hover:bg-primary/10"
            onClick={() => setStatus("editing")}
            tabIndex={0}
          >
            <Pencil className="h-5 w-5 text-primary" />
          </button>
        )}
      </div>
      {/* Input and save button */}
      <div className="flex items-center gap-2">
        <input
          className={clsx(
            "w-full py-2 px-4 rounded-lg border outline-none transition-all duration-300 bg-gray-50 text-gray-900 text-base font-medium shadow-sm",
            status === "editing"
              ? "border-primary ring-2 ring-primary bg-white"
              : "border-gray-200 cursor-default"
          )}
          value={input}
          readOnly={status !== "editing"}
          onFocus={() => setStatus("editing")}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Código MINEDUC"
        />
        {/* Save button with animation */}
        {(status === "editing" || status === "saving") && (
          <button
            onClick={handleSave}
            className="ml-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow transition-all duration-200 hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
            disabled={status === "saving"}
            aria-label="Guardar código MINEDUC"
          >
            {status === "saving" ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span>Guardar</span>
            )}
          </button>
        )}
        {/* Success indicator if not editing */}
        {status === "success" && (
          <CheckCircle className="h-5 w-5 text-green-400 animate-fade-in" />
        )}
      </div>
      {/* Error message */}
      {status === "error" && (
        <div className="mt-2 text-xs text-red-500 animate-fade-in">
          Error al guardar
        </div>
      )}
      
    </div>
  );
}

export default EditableMineducId;
