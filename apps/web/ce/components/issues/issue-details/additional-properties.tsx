import React, { useState } from "react";
import useSWR from "swr";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

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

// Custom Field Input Components
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

// Fetch custom fields for project
const useCustomFields = (workspaceSlug: string, projectId: string | null) => {
  const { data, error, isLoading } = useSWR<CustomFieldDefinition[]>(
    projectId ? `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/` : null,
    (url: string) =>
      fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).then((res) => res.json())
  );

  return {
    fields: data || [],
    isLoading,
    error,
  };
};

export function WorkItemAdditionalSidebarProperties(props: TWorkItemAdditionalSidebarProperties) {
  const { projectId, workspaceSlug, workItemId } = props;
  const [values, setValues] = useState<CustomFieldValues>({});
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch custom fields for this project
  const { fields, isLoading } = useCustomFields(workspaceSlug, projectId);

  // Update a field value
  const updateFieldValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    // TODO: Persist value to backend immediately
  };

  // If no custom fields, return null
  if (!projectId || isLoading) {
    return null;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-custom-border-200 pt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-custom-text-200 hover:text-custom-text-100"
      >
        <span>Campos Personalizados ({fields.length})</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-xs font-medium text-custom-text-300 flex items-center gap-1">
                {field.name}
              </label>
              <CustomFieldInput
                field={field}
                value={values[field.id]}
                onChange={(value) => updateFieldValue(field.id, value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
