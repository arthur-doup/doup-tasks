import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";

interface TimeTrackingEntry {
    id: string;
    start_time: string;
    end_time?: string;
    duration_seconds: number;
    formatted_duration: string;
    description?: string;
    is_running: boolean;
    user_name: string;
}

interface TimeTrackingSummary {
    total_seconds: number;
    formatted_total: string;
    entry_count: number;
    is_timer_running: boolean;
    running_entry_id: string | null;
}

interface TimeTrackingProps {
    workspaceSlug: string;
    projectId: string;
    issueId: string;
}

// Format seconds to HH:MM:SS
const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Hook to fetch time tracking data
const useTimeTracking = (workspaceSlug: string, projectId: string, issueId: string) => {
    const baseUrl = `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-tracking`;

    const { data: summary, error: summaryError } = useSWR<TimeTrackingSummary>(
        `${baseUrl}/summary/`,
        (url: string) =>
            fetch(url, { credentials: "include" }).then((res) => res.json()),
        { refreshInterval: 5000 }
    );

    const { data: entries } = useSWR<TimeTrackingEntry[]>(
        `${baseUrl}/`,
        (url: string) =>
            fetch(url, { credentials: "include" }).then((res) => res.json())
    );

    const startTimer = async () => {
        await fetch(`${baseUrl}/start/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        mutate(`${baseUrl}/summary/`);
        mutate(`${baseUrl}/`);
    };

    const stopTimer = async () => {
        await fetch(`${baseUrl}/stop/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        mutate(`${baseUrl}/summary/`);
        mutate(`${baseUrl}/`);
    };

    const addManualTime = async (hours: number, minutes: number, description: string) => {
        await fetch(`${baseUrl}/manual/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hours, minutes, seconds: 0, description }),
        });
        mutate(`${baseUrl}/summary/`);
        mutate(`${baseUrl}/`);
    };

    return {
        summary,
        entries,
        isLoading: !summary && !summaryError,
        startTimer,
        stopTimer,
        addManualTime,
    };
};

// Time Tracking Button Component (for issue cards)
export const TimeTrackingButton: React.FC<TimeTrackingProps> = ({
    workspaceSlug,
    projectId,
    issueId,
}) => {
    const { summary, startTimer, stopTimer } = useTimeTracking(workspaceSlug, projectId, issueId);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (!summary?.is_timer_running) {
            setElapsedTime(summary?.total_seconds || 0);
            return;
        }

        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [summary?.is_timer_running, summary?.total_seconds]);

    const handleToggle = async () => {
        if (summary?.is_timer_running) {
            await stopTimer();
        } else {
            await startTimer();
        }
    };

    return (
        <button
            onClick={handleToggle}
            title={summary?.is_timer_running ? "Parar timer" : "Iniciar timer"}
            className={`
        flex items-center gap-1 px-2 py-1 rounded text-xs
        ${summary?.is_timer_running
                    ? "bg-green-500/10 text-green-500 border border-green-500/30"
                    : "bg-custom-background-90 text-custom-text-300 hover:bg-custom-background-80"
                }
      `}
        >
            {summary?.is_timer_running ? "⏸" : "▶"}
            <span>{formatDuration(elapsedTime)}</span>
        </button>
    );
};

// Time Tracking Detail Panel
export const TimeTrackingPanel: React.FC<TimeTrackingProps> = ({
    workspaceSlug,
    projectId,
    issueId,
}) => {
    const { summary, entries, startTimer, stopTimer, addManualTime } = useTimeTracking(
        workspaceSlug,
        projectId,
        issueId
    );
    const [showAddManual, setShowAddManual] = useState(false);
    const [manualHours, setManualHours] = useState(0);
    const [manualMinutes, setManualMinutes] = useState(0);
    const [manualDescription, setManualDescription] = useState("");

    const handleAddManual = async () => {
        await addManualTime(manualHours, manualMinutes, manualDescription);
        setShowAddManual(false);
        setManualHours(0);
        setManualMinutes(0);
        setManualDescription("");
    };

    return (
        <div className="border border-custom-border-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-custom-text-100 flex items-center gap-2">
                    ⏱️ Time Tracking
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddManual(!showAddManual)}
                        className="text-custom-text-300 hover:text-custom-text-100 text-lg"
                    >
                        +
                    </button>
                    <button
                        onClick={summary?.is_timer_running ? stopTimer : startTimer}
                        className={`
              flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium
              ${summary?.is_timer_running
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }
            `}
                    >
                        {summary?.is_timer_running ? "⏸ Parar" : "▶ Iniciar"}
                    </button>
                </div>
            </div>

            <div className="text-center py-4">
                <div className="text-3xl font-mono font-bold text-custom-text-100">
                    {summary?.formatted_total || "00:00:00"}
                </div>
                <div className="text-xs text-custom-text-300 mt-1">
                    {summary?.entry_count || 0} entradas registradas
                </div>
            </div>

            {showAddManual && (
                <div className="border-t border-custom-border-200 pt-4 mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-custom-text-300">Horas</label>
                            <input
                                type="number"
                                min="0"
                                value={manualHours}
                                onChange={(e) => setManualHours(Number(e.target.value))}
                                className="w-full px-2 py-1 border border-custom-border-200 rounded text-sm bg-custom-background-100"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-custom-text-300">Minutos</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={manualMinutes}
                                onChange={(e) => setManualMinutes(Number(e.target.value))}
                                className="w-full px-2 py-1 border border-custom-border-200 rounded text-sm bg-custom-background-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-custom-text-300">Descrição</label>
                        <input
                            type="text"
                            value={manualDescription}
                            onChange={(e) => setManualDescription(e.target.value)}
                            placeholder="O que você fez?"
                            className="w-full px-2 py-1 border border-custom-border-200 rounded text-sm bg-custom-background-100"
                        />
                    </div>
                    <button
                        onClick={handleAddManual}
                        className="w-full bg-custom-primary-100 text-white py-1.5 rounded text-sm font-medium"
                    >
                        Adicionar tempo
                    </button>
                </div>
            )}

            {entries && entries.length > 0 && (
                <div className="border-t border-custom-border-200 pt-4 mt-4 space-y-2">
                    <h4 className="text-xs font-medium text-custom-text-300">Histórico</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {entries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between text-sm py-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-custom-text-200">{entry.user_name}</span>
                                    {entry.description && <span className="text-custom-text-300">- {entry.description}</span>}
                                </div>
                                <span className={`font-mono ${entry.is_running ? "text-green-500" : "text-custom-text-100"}`}>
                                    {entry.formatted_duration}
                                    {entry.is_running && " ●"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTrackingButton;
