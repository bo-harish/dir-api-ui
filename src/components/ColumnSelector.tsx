import React, { useState, useEffect } from "react";
import { SlidersHorizontal, GripVertical, Check, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

export interface ColumnDefinition {
  id: string;
  label: string;
  visible: boolean;
  canHide?: boolean; // if false, cannot be hidden (e.g., action if desired)
}

export const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: "lcId", label: "LC ID", visible: true },
  { id: "specimenId", label: "Specimen ID", visible: true, canHide: false },
  { id: "reportStatus", label: "Report Status", visible: true },
  { id: "panelName", label: "Panel Name", visible: true },
  { id: "reportTitle", label: "Report Title", visible: true },
  { id: "patientName", label: "Patient Name", visible: true },
  { id: "dateOfBirth", label: "DOB", visible: true },
  { id: "collected", label: "Collected", visible: true },
  { id: "received", label: "Received", visible: true },
  { id: "reported", label: "Reported", visible: true },
  { id: "facility", label: "Facility", visible: true },
  { id: "facilityAddress", label: "Facility Address", visible: true },
  { id: "provider", label: "Provider", visible: true },
  { id: "providerLocation", label: "Provider Location", visible: false },
  { id: "providerState", label: "Provider State", visible: false },
  { id: "gender", label: "Gender", visible: false },
  { id: "mrn", label: "MRN", visible: false },
  { id: "collectionMethodCode", label: "Collection Method Code", visible: false },
  { id: "collectionMethodLabel", label: "Collection Method Label", visible: false },
  { id: "providerTitle", label: "Provider Title", visible: false },
  { id: "providerNPI", label: "Provider NPI", visible: false },
  { id: "currentMedicationsList", label: "Current Medications List", visible: false },
  { id: "currentMedicationsModelName", label: "Current Medications Model Name", visible: false },
  { id: "currentMedicationsReason", label: "Current Medications Reason", visible: false },
  { id: "currentMedicationsComments", label: "Current Medications Comments", visible: false },
  { id: "lastUpdated", label: "Last Updated", visible: false },
];

interface ColumnSelectorProps {
  columns: ColumnDefinition[];
  onApply: (updatedColumns: ColumnDefinition[]) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onApply }) => {
  const [open, setOpen] = useState(false);
  const [draftColumns, setDraftColumns] = useState<ColumnDefinition[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync draft when popover opens or columns change
  useEffect(() => {
    if (open) {
      setDraftColumns([...columns]);
      setSearchQuery("");
    }
  }, [open, columns]);

  const handleToggle = (id: string) => {
    setDraftColumns((prev) =>
      prev.map((col) => {
        if (col.id === id) {
          if (col.canHide === false) return col;
          return { ...col, visible: !col.visible };
        }
        return col;
      })
    );
  };

  const isSearching = searchQuery.trim().length > 0;
  const filteredColumns = draftColumns.filter((col) =>
    col.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelectAll = () => {
    if (isSearching) {
      const matchingIds = new Set(filteredColumns.map((c) => c.id));
      setDraftColumns((prev) =>
        prev.map((col) => (matchingIds.has(col.id) ? { ...col, visible: true } : col))
      );
    } else {
      setDraftColumns((prev) => prev.map((col) => ({ ...col, visible: true })));
    }
  };

  const handleDeselectAll = () => {
    if (isSearching) {
      const matchingIds = new Set(filteredColumns.map((c) => c.id));
      setDraftColumns((prev) =>
        prev.map((col) =>
          matchingIds.has(col.id) && col.canHide !== false
            ? { ...col, visible: false }
            : col
        )
      );
    } else {
      setDraftColumns((prev) =>
        prev.map((col) =>
          col.canHide === false ? { ...col, visible: true } : { ...col, visible: false }
        )
      );
    }
  };

  const handleApply = () => {
    onApply(draftColumns);
    setOpen(false);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSearching) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isSearching || draggedIndex === null || draggedIndex === index) return;

    const updated = [...draftColumns];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, movedItem);

    setDraggedIndex(index);
    setDraftColumns(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-input bg-background hover:bg-accent text-muted-foreground hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              aria-label="Customize columns"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {/* Red dot badge matching the reference image */}
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background pointer-events-none" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Column Selector
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[280px] p-3 rounded-xl bg-popover shadow-xl border border-border flex flex-col"
      >
        {/* Header with Select All / Deselect All */}
        <div className="flex items-center justify-between pb-2 border-b border-border/70 px-0.5">
          <span className="text-xs font-semibold text-foreground">Columns</span>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              Select All
            </button>
            <span className="text-muted-foreground/40 text-[10px]">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative my-2 px-0.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search columns..."
            className="h-8 pl-8 pr-7 text-xs bg-muted/40 focus-visible:bg-background rounded-lg border-border/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Scrollable column list */}
        <div className="max-h-[360px] overflow-y-auto pr-1 space-y-0.5 select-none scrollbar-thin">
          {filteredColumns.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No columns matching "{searchQuery}"
            </div>
          ) : (
            filteredColumns.map((col) => {
              const actualIndex = draftColumns.findIndex((c) => c.id === col.id);
              const isDragging = draggedIndex === actualIndex;
              const isMandatory = col.canHide === false;

              return (
                <div
                  key={col.id}
                  draggable={!isSearching}
                  onDragStart={(e) => handleDragStart(e, actualIndex)}
                  onDragOver={(e) => handleDragOver(e, actualIndex)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !isMandatory && handleToggle(col.id)}
                  className={`group flex items-center gap-2 py-1.5 px-1.5 rounded-md transition-colors ${isDragging
                    ? "opacity-40 bg-accent/60"
                    : isMandatory
                      ? "hover:bg-muted/40 cursor-default"
                      : "hover:bg-muted/70 active:bg-muted cursor-pointer"
                    }`}
                >
                  {/* Drag handle */}
                  <div
                    className={`${isSearching ? "opacity-30 cursor-not-allowed" : "cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} transition-colors shrink-0`}
                    title={isSearching ? "Clear search to reorder" : "Drag to reorder"}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>

                  {/* Custom Checkbox */}
                  <div
                    role="checkbox"
                    aria-checked={col.visible}
                    aria-disabled={isMandatory}
                    title={isMandatory ? "Mandatory field" : undefined}
                    className={`h-4 w-4 shrink-0 rounded-[4px] flex items-center justify-center transition-all ${isMandatory
                      ? "bg-[#00a67e]/60 text-white cursor-not-allowed"
                      : col.visible
                        ? "bg-[#00a67e] text-white"
                        : "border border-slate-300 dark:border-slate-600 bg-background"
                      }`}
                  >
                    {col.visible && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>

                  {/* Column Label */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span
                      className={`text-[13px] font-medium truncate ${isMandatory
                        ? "text-slate-600 dark:text-slate-400"
                        : "text-slate-700 dark:text-slate-200"
                        }`}
                    >
                      {col.label}
                    </span>
                    {isMandatory && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded text-nowrap">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Apply Button */}
        <div className="pt-3 mt-1.5 border-t border-border/50">
          <button
            type="button"
            onClick={handleApply}
            className="w-full bg-[#00a67e] hover:bg-[#00906d] active:scale-[0.99] text-white font-medium text-sm py-2 rounded-lg transition-all shadow-sm flex items-center justify-center"
          >
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

