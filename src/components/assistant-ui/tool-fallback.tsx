"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Convert tool name from snake_case to readable format */
function formatToolName(name: string): string {
  return name
    .replace(/^halter_/, "") // Remove halter_ prefix
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letters
}

type StatusType = "running" | "complete" | "incomplete" | "requires-action";

/** Get description text based on status */
function getStatusDescription(
  toolName: string,
  statusType: StatusType,
): string {
  const formattedName = formatToolName(toolName);
  switch (statusType) {
    case "running":
      return `Fetching ${formattedName}...`;
    case "complete":
      return `Fetched ${formattedName}`;
    case "incomplete":
      return `Failed to fetch ${formattedName}`;
    default:
      return `Using ${formattedName}`;
  }
}

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const description = getStatusDescription(toolName, status.type as StatusType);
  const isRunning = status.type === "running";
  const isComplete = status.type === "complete";
  const isIncomplete = status.type === "incomplete";

  return (
    <div
      className={cn(
        "aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3",
        isIncomplete && "border-destructive/50 bg-destructive/5",
      )}
    >
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        {isRunning && (
          <LoaderIcon className="aui-tool-fallback-icon size-4 animate-spin text-muted-foreground" />
        )}
        {isComplete && (
          <CheckIcon className="aui-tool-fallback-icon size-4 text-green-600 dark:text-green-500" />
        )}
        {isIncomplete && (
          <XIcon className="aui-tool-fallback-icon size-4 text-destructive" />
        )}
        <p className="aui-tool-fallback-title flex-grow text-sm">
          {description}
        </p>
        {!isRunning && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
            aria-label={isCollapsed ? "Show details" : "Hide details"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronUpIcon className="size-4" />
            )}
          </Button>
        )}
      </div>
      {!isCollapsed && !isRunning && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          <div className="aui-tool-fallback-args-root px-4">
            <p className="text-xs font-medium text-muted-foreground">
              Arguments:
            </p>
            <pre className="aui-tool-fallback-args-value mt-1 whitespace-pre-wrap text-xs">
              {argsText || "(none)"}
            </pre>
          </div>
          {result !== undefined && (
            <div className="aui-tool-fallback-result-root border-t border-dashed px-4 pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Result:
              </p>
              <pre className="aui-tool-fallback-result-content mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          {isIncomplete &&
            "error" in status &&
            status.error !== undefined && (
              <div className="aui-tool-fallback-error-root border-t border-dashed px-4 pt-2">
                <p className="text-xs font-medium text-destructive">Error:</p>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-destructive">
                  {String(status.error)}
                </pre>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
