import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Map tool names to user-friendly descriptions
const toolDescriptions: Record<string, string> = {
  halter_get_farm_summary: "Getting farm overview",
  halter_get_herd_health: "Checking herd health",
  halter_get_alerts: "Fetching alerts",
  halter_get_mating_data: "Loading mating data",
  halter_get_pasture_data: "Checking pasture status",
  halter_get_pasture_summary: "Getting pasture summary",
  halter_get_animal_details: "Getting animal details",
  halter_get_gps_data: "Loading GPS tracking",
};

const getToolDescription = (toolName: string, forComplete = false): string => {
  const description = toolDescriptions[toolName];
  if (description) {
    return forComplete ? description.replace(/ing\b/, "ed") : description;
  }
  // Fallback for unknown tools
  const readableName = toolName.replace(/_/g, " ");
  return forComplete ? `Ran ${readableName}` : `Running ${readableName}`;
};

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isRunning = status?.type === "running";
  const isComplete = status?.type === "complete";

  return (
    <div
      className={`aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3 transition-colors ${
        isRunning
          ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30"
          : ""
      }`}
    >
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        {isRunning ? (
          <LoaderIcon className="aui-tool-fallback-icon size-4 animate-spin text-blue-600 dark:text-blue-400" />
        ) : (
          <CheckIcon className="aui-tool-fallback-icon size-4 text-green-600 dark:text-green-400" />
        )}
        <p className="aui-tool-fallback-title flex-grow text-sm">
          {isRunning ? (
            <span className="text-blue-700 dark:text-blue-300">
              {getToolDescription(toolName)}...
            </span>
          ) : (
            <span className="text-muted-foreground">
              {getToolDescription(toolName, true)}
            </span>
          )}
        </p>
        {isComplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 px-2"
          >
            {isCollapsed ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronUpIcon className="size-4" />
            )}
          </Button>
        )}
      </div>
      {!isCollapsed && isComplete && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          <div className="aui-tool-fallback-args-root px-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Arguments:
            </p>
            <pre className="aui-tool-fallback-args-value max-h-32 overflow-auto whitespace-pre-wrap text-xs">
              {argsText}
            </pre>
          </div>
          {result !== undefined && (
            <div className="aui-tool-fallback-result-root border-t border-dashed px-4 pt-2">
              <p className="aui-tool-fallback-result-header mb-1 text-xs font-medium text-muted-foreground">
                Result:
              </p>
              <pre className="aui-tool-fallback-result-content max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
