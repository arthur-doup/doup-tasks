import React, { useState, useEffect } from "react";
import useSWR from "swr";
// types
import type { TWorkItemModalAdditionalPropertiesProps } from "./types";

// Types for custom fields
interface CustomFieldDefinition {
  id: string;
  name: string;
  field_type: string;
}

// Fetch custom fields for project
const useCustomFields = (workspaceSlug: string, projectId: string | null) => {
  const { data, error, isLoading } = useSWR<CustomFieldDefinition[]>(
    projectId ? `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/` : null,
    (url: string) =>
      fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      }),
    {
      revalidateOnFocus: false, // Evita refetch agressivo
      shouldRetryOnError: false, // Evita loop de erro
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

  // Debug log
  useEffect(() => {
    console.log("[CustomFields] Mounting component", { projectId, workspaceSlug });
  }, [projectId, workspaceSlug]);

  const { fields, isLoading, error } = useCustomFields(workspaceSlug, projectId);

  if (!projectId) return null;
  if (isLoading) return <div className="p-2 text-xs text-custom-text-300">Carregando campos...</div>;
  if (error) return <div className="p-2 text-xs text-red-500">Erro ao carregar campos.</div>;
  if (fields.length === 0) return null;

  return (
    <div className="mt-4 border-t border-custom-border-200 pt-4">
      <h4 className="text-sm font-medium mb-2">Campos Customizados (DEBUG MODE)</h4>
      <div className="space-y-1">
        {fields.map((f) => (
          <div key={f.id} className="text-xs text-custom-text-200 p-1 border border-custom-border-200 rounded">
            {f.name} ({f.field_type})
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
        ⚠️ Modo debug: Inputs desativados para evitar travamento.
      </div>
    </div>
  );
}
