import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Plus } from "lucide-react";
import { useSpecimenContext } from "@/context/SpecimenContext";
import { Specimen } from "@/data/mockSpecimens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Files,
  Upload,
  FileDown,
  ArrowUpDown,
  ArrowLeftRight,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Dna,
  FileSpreadsheet,
  FileCode2,
  FileCheck2,
  ArrowUpRight,
  Hourglass,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LabHeader from "@/components/LabHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColumnSelector, DEFAULT_COLUMNS, ColumnDefinition } from "@/components/ColumnSelector";
import { ImportModal, ImportType } from "@/components/ImportModal";
import { Checkbox } from "@/components/ui/checkbox";

const LOCAL_STORAGE_KEY = "lab_user_table_columns_v6";
const LOCAL_STORAGE_WIDTHS_KEY = "lab_user_column_widths_v2";

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  lcId: 110,
  specimenId: 140,
  reportStatus: 130,
  panelName: 160,
  reportTitle: 160,
  patientFirstName: 130,
  patientLastName: 130,
  collected: 110,
  received: 110,
  reported: 110,
  facility: 160,
  facilityAddressLine1: 170,
  facilityAddressLine2: 160,
  facilityCity: 130,
  facilityState: 110,
  facilityCountry: 120,
  facilityZip: 110,
  provider: 160,
  providerLocation: 180,
  providerState: 110,
  dateOfBirth: 110,
  gender: 90,
  mrn: 110,
  collectionMethodCode: 150,
  collectionMethodLabel: 160,
  providerTitle: 110,
  providerNPI: 120,
  currentMedicationsList: 170,
  currentMedicationsModelName: 170,
  currentMedicationsReason: 170,
  currentMedicationsComments: 170,
  lastUpdated: 130,
  downloadPdf: 135,
  exception: 80,
  action: 180,
};

const getInitialColumnWidths = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_WIDTHS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to parse saved column widths", e);
  }
  return {};
};

const getInitialColumns = (): ColumnDefinition[] => {
  try {
    try {
      localStorage.removeItem("lab_user_table_columns_v4");
      localStorage.removeItem("lab_user_table_columns_v5");
    } catch (e) {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnDefinition[];
      const defaultIds = new Set(DEFAULT_COLUMNS.map((c) => c.id));
      const filtered = parsed.filter((c) => defaultIds.has(c.id));
      const labelMap = new Map(DEFAULT_COLUMNS.map((c) => [c.id, c.label]));
      const canHideMap = new Map(DEFAULT_COLUMNS.map((c) => [c.id, c.canHide]));
      const updatedSaved = filtered.map((c) => ({
        ...c,
        label: labelMap.get(c.id) || c.label,
        canHide: canHideMap.get(c.id),
        visible: c.id === "specimenId" ? true : c.visible,
      }));
      const existingIds = new Set(updatedSaved.map((c) => c.id));
      const missing = DEFAULT_COLUMNS.filter((c) => !existingIds.has(c.id));
      return [...updatedSaved, ...missing];
    }
  } catch (e) {
    console.error("Failed to parse saved columns", e);
  }
  return DEFAULT_COLUMNS;
};

const PAGE_SIZE = 10;

type ReportFilter = "all" | "awaiting" | "processing" | "released";

const getDisplayStatus = (status: string, hasView: boolean) => {
  if (status?.toLowerCase() === "pending") return "Pending";
  if (status?.toLowerCase() === "processing") return "Processing";
  if (hasView) return "Released";
  return "Awaiting Release";
};

type FilterState = {
  collectedFrom: string;
  collectedTo: string;
  receivedFrom: string;
  receivedTo: string;
  reportedFrom: string;
  reportedTo: string;
};

const getLast30Days = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    from: formatInput(start),
    to: formatInput(end),
  };
};

const getDefaultFilters = (): FilterState => {
  const last30 = getLast30Days();
  return {
    collectedFrom: last30.from,
    collectedTo: last30.to,
    receivedFrom: "",
    receivedTo: "",
    reportedFrom: "",
    reportedTo: "",
  };
};

const formatFilterDate = (val: string) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [yyyy, mm, dd] = val.split("-");
    return `${mm}-${dd}-${yyyy}`;
  }
  return val;
};

const isAnyFilterSet = (filters: FilterState): boolean => {
  return Object.values(filters).some((val) => val && val.trim() !== "");
};

const getAppliedFilterCount = (filters: FilterState): number => {
  let count = 0;
  if (filters.collectedFrom || filters.collectedTo) count++;
  if (filters.receivedFrom || filters.receivedTo) count++;
  if (filters.reportedFrom || filters.reportedTo) count++;
  return count;
};

const LabUserDashboard = () => {
  const [search, setSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("all");
  const [selectedProcessingIds, setSelectedProcessingIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(getDefaultFilters);
  const [environment, setEnvironment] = useState<string>("live");
  const [columns, setColumns] = useState<ColumnDefinition[]>(getInitialColumns);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(getInitialColumnWidths);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>("cnv");
  const navigate = useNavigate();
  const { specimens, updateSpecimen } = useSpecimenContext();

  const handleGenerateReport = (specimen: Specimen) => {
    toast.info(`Generating report for ${specimen.specimenId}...`);
    setTimeout(() => {
      updateSpecimen(specimen.id, {
        status: "New",
        hasDownload: true,
        hasView: true,
        reported: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      });
      toast.success(`Report generated successfully for ${specimen.specimenId}!`);
    }, 800);
  };

  const handleOpenImport = (type: ImportType) => {
    setImportType(type);
    setImportModalOpen(true);
  };

  const handleColumnsChange = (updated: ColumnDefinition[]) => {
    setColumns(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist columns", e);
    }
  };

  const visibleColumns = columns.filter((c) => c.visible);

  const getColWidth = (id: string): number => {
    return columnWidths[id] || DEFAULT_COLUMN_WIDTHS[id] || 130;
  };

  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = getColWidth(colId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(70, startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [colId]: newWidth }));
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const delta = upEvent.clientX - startX;
      const finalWidth = Math.max(70, startWidth + delta);
      setColumnWidths((prev) => {
        const next = { ...prev, [colId]: finalWidth };
        try {
          localStorage.setItem(LOCAL_STORAGE_WIDTHS_KEY, JSON.stringify(next));
        } catch (err) { }
        return next;
      });
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleToggleColumnWidth = (colId: string) => {
    const defaultW = DEFAULT_COLUMN_WIDTHS[colId] || 130;
    const currentW = getColWidth(colId);
    const newW = currentW > defaultW + 20 ? defaultW : defaultW + 70;
    setColumnWidths((prev) => {
      const next = { ...prev, [colId]: newW };
      try {
        localStorage.setItem(LOCAL_STORAGE_WIDTHS_KEY, JSON.stringify(next));
      } catch (err) { }
      return next;
    });
  };

  const handleAdjustAllWidths = (delta: number) => {
    setColumnWidths((prev) => {
      const next: Record<string, number> = {};
      visibleColumns.forEach((c) => {
        const current = prev[c.id] || DEFAULT_COLUMN_WIDTHS[c.id] || 130;
        next[c.id] = Math.max(70, current + delta);
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_WIDTHS_KEY, JSON.stringify(next));
      } catch (err) { }
      return next;
    });
  };

  const handleSetPresetWidth = (preset: "compact" | "comfortable" | "wide" | "extra-wide") => {
    const offsets = {
      compact: 0,
      comfortable: 30,
      wide: 60,
      "extra-wide": 100,
    };
    const offset = offsets[preset] ?? 0;
    setColumnWidths(() => {
      const next: Record<string, number> = {};
      DEFAULT_COLUMNS.forEach((c) => {
        const base = DEFAULT_COLUMN_WIDTHS[c.id] || 130;
        next[c.id] = base + offset;
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_WIDTHS_KEY, JSON.stringify(next));
      } catch (err) { }
      return next;
    });
  };

  const handleResetWidths = () => {
    setColumnWidths({});
    try {
      localStorage.removeItem(LOCAL_STORAGE_WIDTHS_KEY);
    } catch (err) { }
  };

  const appliedCount = getAppliedFilterCount(appliedFilters);

  const filtered = specimens
    .filter((s) =>
      s.specimenId.toLowerCase().includes(search.toLowerCase()) ||
      `${s.patientFirstName} ${s.patientLastName}`.toLowerCase().includes(search.toLowerCase())
    )
    .filter((s) => {
      if (reportFilter === "awaiting") return !s.hasView && s.status?.toLowerCase() !== "processing" && s.status?.toLowerCase() !== "pending";
      if (reportFilter === "processing") return s.status?.toLowerCase() === "processing";
      if (reportFilter === "released") return s.hasView;
      return true;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const processingPageIds = paginated.map((s) => s.id);
  const isAllProcessingSelected =
    processingPageIds.length > 0 && processingPageIds.every((id) => selectedProcessingIds.includes(id));
  const isSomeProcessingSelected =
    selectedProcessingIds.length > 0 && !isAllProcessingSelected;

  const handleSelectAllProcessing = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const next = Array.from(new Set([...selectedProcessingIds, ...processingPageIds]));
      setSelectedProcessingIds(next);
    } else {
      setSelectedProcessingIds((prev) => prev.filter((id) => !processingPageIds.includes(id)));
    }
  };

  const handleToggleSelectProcessing = (id: string, checked: boolean) => {
    setSelectedProcessingIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleBulkGenerateReports = () => {
    if (selectedProcessingIds.length === 0) return;
    const count = selectedProcessingIds.length;
    toast.info(`Generating reports for ${count} selected specimen(s)...`);
    setTimeout(() => {
      selectedProcessingIds.forEach((id) => {
        updateSpecimen(id, {
          status: "New",
          hasDownload: true,
          hasView: true,
          reported: new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }),
        });
      });
      toast.success(`Successfully generated reports for ${count} specimen(s)!`);
      setSelectedProcessingIds([]);
    }, 900);
  };

  const handleFilterChange = (filter: ReportFilter) => {
    setReportFilter(filter);
    setCurrentPage(1);
    setSelectedProcessingIds([]);
  };

  const updateDraft = (key: keyof FilterState, value: string) =>
    setDraftFilters((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    let toApply = draftFilters;
    if (!isAnyFilterSet(draftFilters)) {
      toApply = getDefaultFilters();
      setDraftFilters(toApply);
      toast.info("At least one filter is mandatory. Defaulted to Collected Date (Last 30 days).");
    }
    setAppliedFilters(toApply);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleClearAll = () => {
    const defaultFilters = getDefaultFilters();
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
    toast.info("Filters reset to default. At least one filter is mandatory (Last 30 days).");
  };

  const renderResizeHandle = (colId: string) => (
    <div
      onMouseDown={(e) => handleResizeStart(e, colId)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleToggleColumnWidth(colId);
      }}
      onClick={(e) => e.stopPropagation()}
      title="Drag to resize column width, or double-click to expand"
      className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group-hover:bg-primary/10 hover:!bg-primary/25 transition-colors z-10"
    >
      <div className="w-[1.5px] h-4 rounded bg-muted-foreground/30 group-hover:bg-primary/70 transition-colors" />
    </div>
  );

  const renderCellContent = (colId: string, specimen: Specimen, idx: number) => {
    switch (colId) {
      case "lcId":
        return <span className="font-medium">{specimen.lcId || "—"}</span>;
      case "specimenId":
        return (
          <span
            className="font-medium text-link cursor-pointer hover:underline"
            onClick={() => navigate(`/lab-user/specimen/${specimen.id}`)}
          >
            {specimen.specimenId}
          </span>
        );
      case "reportStatus": {
        const displayStatus = getDisplayStatus(specimen.status, specimen.hasView);
        if (displayStatus === "Pending") {
          return <span className="text-sky-600 dark:text-sky-400 font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Processing") {
          return <span className="text-amber-600 dark:text-amber-400 font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Released") {
          return <span className="text-emerald-600 dark:text-emerald-400 font-medium">{displayStatus}</span>;
        }
        return <span className="text-muted-foreground font-medium">{displayStatus}</span>;
      }
      case "panelName":
        return <span className="font-medium text-foreground">{specimen.panelName || "Comprehensive PGx Panel"}</span>;
      case "reportTitle":
        return specimen.reportTitle || "Pharmacogenomics Report";
      case "collected":
        return specimen.collected;
      case "received":
        return specimen.received;
      case "reported":
        return specimen.reported;
      case "facility":
        return specimen.facility;
      case "facilityAddressLine1":
        return specimen.facilityAddressLine1 || (specimen.facilityAddress ? specimen.facilityAddress.split(",")[0]?.trim() : "1 Sweet Lane, Suite T");
      case "facilityAddressLine2":
        return specimen.facilityAddressLine2 || "—";
      case "facilityCity":
        return specimen.facilityCity || "Downtown";
      case "facilityState":
        return specimen.facilityState || specimen.providerState || "NE";
      case "facilityCountry":
        return specimen.facilityCountry || "USA";
      case "facilityZip":
        return specimen.facilityZip || "00045";
      case "providerLocation":
        return specimen.facilityAddress || "—";
      case "providerState":
        return specimen.providerState || "NE";
      case "provider":
        return specimen.provider;
      case "dateOfBirth":
        return specimen.dateOfBirth;
      case "gender":
        return specimen.gender;
      case "mrn":
        return specimen.mrn;
      case "patientFirstName":
        return <span className="font-medium">{specimen.patientFirstName}</span>;
      case "patientLastName":
        return <span className="font-medium">{specimen.patientLastName}</span>;
      case "collectionMethodCode":
        return specimen.collectionMethodCode;
      case "collectionMethodLabel":
        return specimen.collectionMethodLabel;
      case "providerTitle":
        return specimen.providerTitle;
      case "providerNPI":
        return specimen.providerNPI;
      case "currentMedicationsList":
        return specimen.currentMedicationsList || "—";
      case "currentMedicationsModelName":
        return specimen.currentMedicationsModelName || "—";
      case "currentMedicationsReason":
        return specimen.currentMedicationsReason || "—";
      case "currentMedicationsComments":
        return specimen.currentMedicationsComments || "—";
      case "lastUpdated":
        return specimen.lastUpdated;
      case "downloadPdf": {
        const isProcessing = specimen.status?.toLowerCase() === "processing";
        const isReleased = getDisplayStatus(specimen.status, specimen.hasView) === "Released" || (specimen.hasDownload && specimen.status?.toLowerCase() !== "pending" && specimen.status?.toLowerCase() !== "processing");

        if (isProcessing) {
          return (
            <div className="flex items-center justify-center">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px] px-2.5 font-medium cursor-pointer text-primary border-primary/40 hover:bg-accent hover:text-white hover:border-accent gap-1.5 transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateReport(specimen);
                }}
              >
                <FileText className="h-3.5 w-3.5 text-primary group-hover:text-white transition-colors" />
                <span>Generate report</span>
              </Button>
            </div>
          );
        }
        if (isReleased) {
          return (
            <div className="flex items-center justify-center">
              <button className="text-link inline-flex items-center gap-1 text-[13px] font-medium cursor-pointer">
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          );
        }
        return null;
      }
      case "exception":
        return [0, 2, 5, 7].includes(idx) ? null : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Exception"
                className="inline-flex items-center justify-center text-destructive hover:opacity-80"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm whitespace-normal break-words text-xs leading-relaxed">
              Drug(s) D1,S2 could not be resolved to a valid DrugBank ID. As a result, all requested medications in this request will be excluded from the PDF report.
            </TooltipContent>
          </Tooltip>
        );
      case "action": {
        const isProcessing = specimen.status?.toLowerCase() === "processing" || reportFilter === "processing";
        const isPending = specimen.status?.toLowerCase() === "pending";
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px] px-2.5 font-medium cursor-pointer hover:border-primary/50"
              onClick={() => navigate(`/lab-user/specimen/${specimen.id}/edit`)}
            >
              EDIT
            </Button>
            {!isProcessing && !isPending && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] px-2.5 cursor-pointer"
              >
                RELEASE
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px] px-2.5 cursor-pointer"
              onClick={() => navigate(`/lab-user/specimen/${specimen.id}/report`)}
            >
              VIEW
            </Button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LabHeader />

      <div className="p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <ColumnSelector columns={columns} onApply={handleColumnsChange} />

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-white cursor-pointer transition-colors group"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 group-hover:text-white transition-colors" />
                    <span>Width</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-white transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Increase or adjust column widths
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onClick={() => handleAdjustAllWidths(30)}>
                <ZoomIn className="h-4 w-4 mr-2 text-primary" /> Increase Width (+30px)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAdjustAllWidths(-30)}>
                <ZoomOut className="h-4 w-4 mr-2 text-muted-foreground" /> Decrease Width (-30px)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSetPresetWidth("compact")}>
                Default / Compact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetPresetWidth("comfortable")}>
                Comfortable (+30px)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetPresetWidth("wide")}>
                Wide (+60px)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetPresetWidth("extra-wide")}>
                Extra Wide (+100px)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetWidths} className="text-muted-foreground text-xs">
                Reset All Widths
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Specimen"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 w-48 h-9"
            />
          </div>

          <Popover
            open={showFilters}
            onOpenChange={(open) => {
              setShowFilters(open);
              if (open) {
                setDraftFilters(appliedFilters);
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border border-input bg-background hover:bg-accent text-muted-foreground hover:text-white cursor-pointer transition-colors ${showFilters ? "text-primary border-primary hover:text-white" : ""}`}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[520px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-foreground">All Filters</h3>
                  {appliedCount > 0 && (
                    <span className="text-sm text-primary font-medium">
                      {appliedCount} {appliedCount === 1 ? "filter" : "filters"} applied
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Collected From</label>
                  <Input type="date" value={draftFilters.collectedFrom} onChange={(e) => updateDraft("collectedFrom", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Collected To</label>
                  <Input type="date" value={draftFilters.collectedTo} onChange={(e) => updateDraft("collectedTo", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Received From</label>
                  <Input type="date" value={draftFilters.receivedFrom} onChange={(e) => updateDraft("receivedFrom", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Received To</label>
                  <Input type="date" value={draftFilters.receivedTo} onChange={(e) => updateDraft("receivedTo", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Reported From</label>
                  <Input type="date" value={draftFilters.reportedFrom} onChange={(e) => updateDraft("reportedFrom", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Reported To</label>
                  <Input type="date" value={draftFilters.reportedTo} onChange={(e) => updateDraft("reportedTo", e.target.value)} />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={() => { handleApply(); setShowFilters(false); }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="ml-auto">
            <Select value={environment || undefined} onValueChange={(v) => setEnvironment(v)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Status View Tabs (Left) & Actions (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={reportFilter === "all" ? "default" : "outline"}
              size="sm"
              className={`h-9 ${reportFilter === "all" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => handleFilterChange("all")}
            >
              <Files className="h-4 w-4" />
              All Reports
            </Button>
            <Button
              variant={reportFilter === "awaiting" ? "default" : "outline"}
              size="sm"
              className={`h-9 ${reportFilter === "awaiting" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => handleFilterChange("awaiting")}
            >
              <Clock className="h-4 w-4" />
              Reports Awaiting Release
            </Button>
            <Button
              variant={reportFilter === "processing" ? "default" : "outline"}
              size="sm"
              className={`h-9 ${reportFilter === "processing" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => handleFilterChange("processing")}
            >
              <Hourglass className="h-4 w-4" />
              Processing Reports
            </Button>
            <Button
              variant={reportFilter === "released" ? "default" : "outline"}
              size="sm"
              className={`h-9 ${reportFilter === "released" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => handleFilterChange("released")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Released Reports
            </Button>
          </div>

          <div className="flex items-center gap-2.5">
            {reportFilter === "processing" && (
              <Button
                variant={selectedProcessingIds.length > 0 ? "default" : "outline"}
                size="sm"
                disabled={selectedProcessingIds.length === 0}
                onClick={handleBulkGenerateReports}
                className={`h-9 gap-1.5 font-medium transition-all ${selectedProcessingIds.length > 0
                  ? "bg-primary text-primary-foreground shadow-sm cursor-pointer"
                  : "opacity-50 cursor-not-allowed text-muted-foreground"
                  }`}
              >
                <FileText className="h-4 w-4" />
                Generate Reports
                {selectedProcessingIds.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] bg-primary-foreground/20 text-primary-foreground font-semibold">
                    {selectedProcessingIds.length}
                  </span>
                )}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 cursor-pointer font-medium hover:border-primary/50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Import Specimen
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] p-1.5 rounded-xl shadow-xl border border-border">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Specimen Ingestion
                </div>
                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={() => handleOpenImport("specimen")}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Import Specimen Batch</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.xlsx</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Upload batch manifest file
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const csvContent =
                      "data:text/csv;charset=utf-8,Specimen ID,Patient First Name,Patient Last Name,DOB,Gender,Facility,Provider,Collection Date\nDEVTest_100,John,Doe,01/01/1990,M,Main Clinic,Dr. Smith,01/15/2026";
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "specimen_import_template.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <FileDown className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Download Template</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.csv</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Sample specimen CSV headers
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 cursor-pointer font-medium hover:border-primary/50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Import Results
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] p-1.5 rounded-xl shadow-xl border border-border">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Genomic Result Imports
                </div>
                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={() => handleOpenImport("cnv")}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Import CNV</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.csv / .xlsx</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Copy Number Variation data
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleOpenImport("snp")}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                    <Dna className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Import SNP</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.csv / .xlsx</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Single Nucleotide Polymorphism
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleOpenImport("slc6a4")}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Import SLC6A4</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.csv / .xlsx</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Targeted genotyping assays
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleOpenImport("vcf")}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileCode2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Import VCF</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.vcf</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Variant Call Format files
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={() => navigate("/lab-user/add-specimen")}
              className="h-9 gap-1.5 cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Specimen
            </Button>
          </div>
        </div>

        {/* Context Badges & Filter Bar above Table */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          {/* Active Filter Pills (Left) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Collected Date Filter Pill */}
            {(appliedFilters.collectedFrom || appliedFilters.collectedTo) && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 px-3.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <span>Collected :</span>
                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {appliedFilters.collectedFrom && appliedFilters.collectedTo
                    ? `${formatFilterDate(appliedFilters.collectedFrom)} → ${formatFilterDate(appliedFilters.collectedTo)}`
                    : appliedFilters.collectedFrom
                      ? `from ${formatFilterDate(appliedFilters.collectedFrom)}`
                      : `until ${formatFilterDate(appliedFilters.collectedTo)}`}
                </span>
                <button
                  type="button"
                  aria-label="Reset Collected filter"
                  onClick={() => {
                    const hasOtherFilter = Boolean(
                      appliedFilters.receivedFrom ||
                      appliedFilters.receivedTo ||
                      appliedFilters.reportedFrom ||
                      appliedFilters.reportedTo
                    );
                    if (hasOtherFilter) {
                      const next = { ...appliedFilters, collectedFrom: "", collectedTo: "" };
                      setAppliedFilters(next);
                      setDraftFilters((d) => ({ ...d, collectedFrom: "", collectedTo: "" }));
                    } else {
                      const defaultFilters = getDefaultFilters();
                      setAppliedFilters(defaultFilters);
                      setDraftFilters(defaultFilters);
                      toast.info("At least one filter is mandatory. Reverted to Collected Date (Last 30 days).");
                    }
                  }}
                  className="ml-1 hover:text-emerald-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Additional Active Filter Pills (Received, Reported) */}
            {(() => {
              const extraGroups: { key: "received" | "reported"; label: string; from: keyof FilterState; to: keyof FilterState }[] = [
                { key: "received", label: "Received", from: "receivedFrom", to: "receivedTo" },
                { key: "reported", label: "Reported", from: "reportedFrom", to: "reportedTo" },
              ];
              const activeExtras = extraGroups.filter((g) => appliedFilters[g.from] || appliedFilters[g.to]);
              return activeExtras.map((g) => {
                const from = appliedFilters[g.from];
                const to = appliedFilters[g.to];
                const range = from && to
                  ? `${formatFilterDate(from)} → ${formatFilterDate(to)}`
                  : from
                    ? `from ${formatFilterDate(from)}`
                    : `until ${formatFilterDate(to)}`;
                return (
                  <div
                    key={g.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 px-3.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"
                  >
                    <span>{g.label} :</span>
                    <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{range}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${g.label} filter`}
                      onClick={() => {
                        const next = { ...appliedFilters, [g.from]: "", [g.to]: "" };
                        if (!isAnyFilterSet(next)) {
                          const defaultFilters = getDefaultFilters();
                          setAppliedFilters(defaultFilters);
                          setDraftFilters(defaultFilters);
                          toast.info("At least one filter is mandatory. Defaulted to Collected Date (Last 30 days).");
                        } else {
                          setAppliedFilters(next);
                          setDraftFilters((d) => ({ ...d, [g.from]: "", [g.to]: "" }));
                        }
                      }}
                      className="ml-1 hover:text-emerald-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              });
            })()}
          </div>

          {/* Time Zone Informational Note (Neutral metadata badge, right-aligned) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-md px-2.5 py-1 select-none shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>Time Zone:</span>
            <span className="font-medium text-foreground">ET (UTC-05:00)</span>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-md overflow-auto">
          <Table className="w-max min-w-full">
            <TableHeader>
              <TableRow className="bg-table-header">
                {reportFilter === "processing" && (
                  <TableHead
                    style={{ width: "44px", minWidth: "44px" }}
                    className="text-center py-2 px-3 align-middle select-none"
                  >
                    <Checkbox
                      checked={isAllProcessingSelected ? true : isSomeProcessingSelected ? "indeterminate" : false}
                      onCheckedChange={handleSelectAllProcessing}
                      aria-label="Select all processing specimens"
                      className="cursor-pointer"
                    />
                  </TableHead>
                )}
                {visibleColumns.map((col) => {
                  const w = getColWidth(col.id);

                  return (
                    <TableHead
                      key={col.id}
                      style={{ width: `${w}px`, minWidth: `${w}px` }}
                      className="relative group text-[13px] font-medium py-2 px-3 align-middle select-none"
                    >
                      <div className="flex items-center gap-1 leading-snug pr-3">
                        <span className="line-clamp-2 break-words">{col.label}</span>
                        <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </div>
                      {renderResizeHandle(col.id)}
                    </TableHead>
                  );
                })}

                {/* Permanent Columns - Always Shown in Grid */}
                {reportFilter !== "processing" && (
                  <TableHead
                    style={{ width: `${getColWidth("downloadPdf") || 135}px`, minWidth: "120px" }}
                    className="relative group text-[13px] font-medium whitespace-nowrap text-center py-2 px-3 align-middle select-none border-l border-border/40"
                  >
                    <span className="pr-2">Download PDF</span>
                    {renderResizeHandle("downloadPdf")}
                  </TableHead>
                )}
                <TableHead
                  style={{ width: `${getColWidth("exception") || 80}px`, minWidth: "70px" }}
                  className="relative group text-[13px] font-medium whitespace-nowrap text-center py-2 px-3 align-middle select-none border-l border-border/40"
                >
                  <span>Exception</span>
                  {renderResizeHandle("exception")}
                </TableHead>
                <TableHead
                  style={{ width: `${getColWidth("action") || 180}px`, minWidth: "160px" }}
                  className="relative group text-[13px] font-medium whitespace-nowrap py-2 px-3 align-middle select-none border-l border-border/40"
                >
                  <span className="pr-2">Action</span>
                  {renderResizeHandle("action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (reportFilter !== "processing" ? 1 : 0) + 2 + (reportFilter === "processing" ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No specimens found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((specimen, idx) => (
                  <TableRow
                    key={specimen.id}
                    className={`hover:bg-muted/50 ${reportFilter === "processing" && selectedProcessingIds.includes(specimen.id)
                      ? "bg-primary/5"
                      : ""
                      }`}
                  >
                    {reportFilter === "processing" && (
                      <TableCell
                        style={{ width: "44px", minWidth: "44px" }}
                        className="text-center py-2 px-3 align-middle select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedProcessingIds.includes(specimen.id)}
                          onCheckedChange={(checked) =>
                            handleToggleSelectProcessing(specimen.id, Boolean(checked))
                          }
                          aria-label={`Select specimen ${specimen.specimenId}`}
                          className="cursor-pointer"
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((col) => {
                      const w = getColWidth(col.id);
                      return (
                        <TableCell
                          key={col.id}
                          style={{ width: `${w}px`, minWidth: `${w}px` }}
                          className={`text-[13px] whitespace-nowrap py-2 px-3 ${col.id === "exception" ? "text-center" : ""}`}
                        >
                          {renderCellContent(col.id, specimen, idx)}
                        </TableCell>
                      );
                    })}

                    {/* Permanent Columns - Always Shown in Grid */}
                    {reportFilter !== "processing" && (
                      <TableCell
                        style={{ width: `${getColWidth("downloadPdf") || 135}px`, minWidth: "120px" }}
                        className="text-[13px] whitespace-nowrap py-2 px-3 text-center border-l border-border/40"
                      >
                        {renderCellContent("downloadPdf", specimen, idx)}
                      </TableCell>
                    )}
                    <TableCell
                      style={{ width: `${getColWidth("exception") || 80}px`, minWidth: "70px" }}
                      className="text-[13px] whitespace-nowrap py-2 px-3 text-center border-l border-border/40"
                    >
                      {renderCellContent("exception", specimen, idx)}
                    </TableCell>
                    <TableCell
                      style={{ width: `${getColWidth("action") || 180}px`, minWidth: "160px" }}
                      className="text-[13px] whitespace-nowrap py-2 px-3 border-l border-border/40"
                    >
                      {renderCellContent("action", specimen, idx)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{filtered.length} Specimens</p>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}

            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        type={importType}
      />
    </div>
  );
};

export default LabUserDashboard;
