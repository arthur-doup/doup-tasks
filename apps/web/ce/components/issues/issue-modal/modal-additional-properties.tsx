import React, { useState } from "react";
import useSWR from "swr";
// types
import type { TWorkItemModalAdditionalPropertiesProps } from "./types";

// Types for custom fields
interface CustomFieldOption {
  id: string;
  value: string;
  color?: string;
}

interface CustomFieldDefinition {
  id: string;
  name: string;
  description?: string;
  field_type: string;
  options: CustomFieldOption[];
  is_required: boolean;
  sort_order: number;
}

interface CustomFieldValues {
  [fieldId: string]: any;
}

const FIELD_TYPES = [
  { label: "Texto", value: "text" },
  { label: "Número", value: "number" },
  { label: "Data", value: "date" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Seleção", value: "select" },
  { label: "Avaliação 1-5", value: "rating" },
  { label: "Progresso %", value: "progress" },
  { label: "Email", value: "email" },
  { label: "Link", value: "url" },
  { label: "Área de Texto", value: "textarea" },
];

// Helper para CSRF
function getCookie(name: string) {
  let cookieValue = null;
  if (typeof document !== "undefined" && document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const CustomFieldInput: React.FC<{
  field: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
}> = ({ field, value, onChange }) => {
  const baseInputClass =
    "w-full text-sm px-4 py-2.5 border border-custom-border-200 rounded bg-custom-background-100 focus:border-custom-primary-100 outline-none transition-all placeholder:text-custom-text-400";

  switch (field.field_type) {
    case "text":
    case "phone":
    case "email":
    case "url":
      return (
        <input
          type={field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          className={baseInputClass}
        />
      );

    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          className={`${baseInputClass} min-h-[80px]`}
          rows={2}
        />
      );

    case "number":
    case "decimal":
      return (
        <input
          type="number"
          step={field.field_type === "decimal" ? "0.01" : "1"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={field.name}
          className={baseInputClass}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer p-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-custom-border-200 text-custom-primary-100 focus:ring-custom-primary-100"
          />
          <span className="text-sm text-custom-text-200 select-none">{field.description || "Ativado"}</span>
        </label>
      );

    case "select":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">Selecione...</option>
          {field.options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.value}
            </option>
          ))}
        </select>
      );

    case "rating":
      return (
        <div className="flex items-center gap-1.5 p-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`text-xl transition-colors ${value >= star ? "text-yellow-500 hover:text-yellow-600" : "text-custom-text-400 hover:text-custom-text-300"
                }`}
            >
              ★
            </button>
          ))}
        </div>
      );

    case "progress":
      return (
        <div className="flex items-center gap-3 p-1">
          <input
            type="range"
            min="0"
            max="100"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-custom-primary-100"
          />
          <span className="text-sm font-medium text-custom-text-200 w-12 text-right">{value || 0}%</span>
        </div>
      );

    default:
      return (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          className={baseInputClass}
        />
      );
  }
};

const useCustomFields = (workspaceSlug: string, projectId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<CustomFieldDefinition[]>(
    projectId ? `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/` : null,
    (url: string) =>
      fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Status: " + res.status);
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    fields: data || [],
    isLoading,
    error,
    mutate,
  };
};

export function WorkItemModalAdditionalProperties(props: TWorkItemModalAdditionalPropertiesProps) {
  const { projectId, workspaceSlug } = props;
  const [values, setValues] = useState<CustomFieldValues>({});

  // State para criação de campo
  const [isCreating, setIsCreating] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [isSavingField, setIsSavingField] = useState(false);

  const { fields, isLoading, error, mutate } = useCustomFields(workspaceSlug, projectId);

  const updateFieldValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCreateField = async () => {
    if (!newFieldName.trim() || !projectId) return;

    setIsSavingField(true);
    try {
      const csrftoken = getCookie("csrftoken");
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken || "",
          },
          credentials: "include",
          body: JSON.stringify({
            name: newFieldName,
            field_type: newFieldType,
            description: "",
            is_required: false,
          }),
        }
      );

      if (res.ok) {
        setNewFieldName("");
        setNewFieldType("text");
        setIsCreating(false);
        mutate(); // Recarrega a lista de campos
      } else {
        alert("Erro ao criar campo. Tente novamente.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    } finally {
      setIsSavingField(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Tem certeza que deseja excluir este campo?")) return;

    try {
      const csrftoken = getCookie("csrftoken");
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/${fieldId}/`,
        {
          method: "DELETE",
          headers: {
            "X-CSRFToken": csrftoken || "",
          },
          credentials: "include",
        }
      );

      if (res.ok) {
        mutate(); // Recarrega a lista de campos
      } else {
        alert("Erro ao excluir campo. Tente novamente.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    }
  };

  if (!projectId) return null;

  return (
    <div className="mt-6 border-t border-custom-border-200 pt-5 px-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-custom-text-100 flex items-center gap-2">
          Campos Personalizados
          {isLoading && <span className="text-xs font-normal text-custom-text-400 animate-pulse">(Carregando...)</span>}
        </h4>

        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="text-xs font-medium text-custom-primary-100 hover:text-custom-primary-200 hover:bg-custom-primary-100/10 px-2 py-1 rounded transition-colors"
          >
            + Criar campo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="text-xs text-custom-text-300 hover:text-custom-text-200"
          >
            Cancelar
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-5 p-3 bg-custom-background-90 rounded border border-custom-border-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-xs text-custom-text-300 mb-1">Nome do Campo</label>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Ex: Cliente, Prioridade..."
                className="w-full text-sm px-2.5 py-1.5 border border-custom-border-200 rounded bg-custom-background-100 focus:border-custom-primary-100 outline-none"
                autoFocus
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-xs text-custom-text-300 mb-1">Tipo</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="w-full text-sm px-2.5 py-1.5 border border-custom-border-200 rounded bg-custom-background-100 focus:border-custom-primary-100 outline-none"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-12 sm:col-span-2">
              <button
                type="button"
                onClick={handleCreateField}
                disabled={isSavingField || !newFieldName.trim()}
                className={`w-full text-xs font-medium py-2 rounded text-white transition-opacity ${isSavingField || !newFieldName.trim()
                  ? "bg-custom-primary-100/50 cursor-not-allowed"
                  : "bg-custom-primary-100 hover:bg-custom-primary-200"
                  }`}
              >
                {isSavingField ? "..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="p-3 text-xs text-red-500 bg-red-500/10 rounded border border-red-500/20">
          Erro ao carregar campos. Verifique sua conexão.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id} className="col-span-1 space-y-1.5 group">
              <span className="text-xs font-medium text-custom-text-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {field.name}
                  {field.is_required && <span className="text-red-500">*</span>}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 text-xs transition-opacity"
                  title="Excluir campo"
                >
                  ✕
                </button>
              </span>
              <CustomFieldInput
                field={field}
                value={values[field.id]}
                onChange={(value) => updateFieldValue(field.id, value)}
              />
            </div>
          ))}

          {!isLoading && fields.length === 0 && !isCreating && (
            <div className="col-span-full py-4 text-center text-xs text-custom-text-400 border border-dashed border-custom-border-200 rounded">
              Nenhum campo personalizado criado neste projeto.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
