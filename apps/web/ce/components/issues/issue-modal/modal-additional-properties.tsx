import React, { useState, useEffect } from "react";
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

const CustomFieldInput: React.FC<{
  field: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
}> = ({ field, value, onChange }) => {
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
          className="w-full text-sm px-2 py-1.5 border border-custom-border-200 rounded bg-custom-background-100"
        />
      );

    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          className="w-full text-sm px-2 py-1.5 border border-custom-border-200 rounded bg-custom-background-100 min-h-[60px]"
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
          className="w-full text-sm px-2 py-1.5 border border-custom-border-200 rounded bg-custom-background-100"
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm px-2 py-1.5 border border-custom-border-200 rounded bg-custom-background-100"
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-custom-border-200"
          />
          <span className="text-sm text-custom-text-200">{field.description || field.name}</span>
        </label>
      );

    case "select":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm px-2 py-1.5 border border-custom-border-200 rounded bg-custom-background-100"
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
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`text-lg ${value >= star ? "text-yellow-500" : "text-custom-text-400"}`}
            >
              ★
            </button>
          ))}
        </div>
      );

    case "progress":
      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-custom-text-200 w-10">{value || 0}%</span>
        </div>
      );

    default:
      return (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          className="w-full text-sm px-2 py-1.5 border border-custom-border-200 rounded bg-custom-background-100"
        />
      );
  }
};

const useCustomFields = (workspaceSlug: string, projectId: string | null) => {
  const { data, error, isLoading } = useSWR<CustomFieldDefinition[]>(
    projectId ? `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/` : null,
    (url: string) =>
      fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Importante para auth via cookie
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
  };
};

export function WorkItemModalAdditionalProperties(props: TWorkItemModalAdditionalPropertiesProps) {
  const { projectId, workspaceSlug } = props;
  const [values, setValues] = useState<CustomFieldValues>({});

  const { fields, isLoading, error } = useCustomFields(workspaceSlug, projectId);

  const updateFieldValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    // TODO: Implementar persistência real
  };

  if (!projectId || isLoading) {
    // Retorna vazio enquanto carrega para não piscar erro
    return null;
  }

  if (error) {
    // Mostra erro discreto
    return <div className="p-2 text-xs text-red-500">Erro ao carregar campos customizados.</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-custom-border-200 pt-4">
      <h4 className="text-sm font-medium mb-2">Campos Personalizados</h4>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-xs font-medium text-custom-text-300 flex items-center gap-1">
              {field.name}
              {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <CustomFieldInput
              field={field}
              value={values[field.id]}
              onChange={(value) => updateFieldValue(field.id, value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
