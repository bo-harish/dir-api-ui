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
  FileCheck,
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
} from "lucide-react";
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

const LOCAL_STORAGE_KEY = "lab_user_table_columns_v5";
const LOCAL_STORAGE_WIDTHS_KEY = "lab_user_column_widths_v1";

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  lcId: 110,
  specimenId: 140,
  reportStatus: 130,
  patientFirstName: 130,
  patientLastName: 130,
  collected: 110,
  received: 110,
  reported: 110,
  facility: 160,
  provider: 160,
  providerLocation: 180,
  providerState: 110,
  dateOfBirth: 110,
  gender: 90,
  race: 110,
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
  downloadPdf: 110,
  exception: 80,
  action: 150,
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
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem("lab_user_table_columns_v4");
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnDefinition[];
      const filtered = parsed.filter((c) => c.id !== "patients");
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

type ReportFilter = "awaiting" | "released" | "all";

const getDisplayStatus = (_status: string, hasView: boolean) => {
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

const emptyFilters: FilterState = {
  collectedFrom: "",
  collectedTo: "",
  receivedFrom: "",
  receivedTo: "",
  reportedFrom: "",
  reportedTo: "",
};


const LabUserDashboard = () => {
  const [search, setSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("awaiting");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);
  const [environment, setEnvironment] = useState<string>("live");
  const [columns, setColumns] = useState<ColumnDefinition[]>(getInitialColumns);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(getInitialColumnWidths);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>("cnv");
  const navigate = useNavigate();
  const { specimens } = useSpecimenContext();

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

  const appliedCount = Object.values(appliedFilters).filter((v) => v && v !== "").length;

  const filtered = specimens
    .filter((s) =>
      s.specimenId.toLowerCase().includes(search.toLowerCase()) ||
      `${s.patientFirstName} ${s.patientLastName}`.toLowerCase().includes(search.toLowerCase())
    )
    .filter((s) => {
      if (reportFilter === "awaiting") return !s.hasView;
      if (reportFilter === "released") return s.hasView;
      return true;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (filter: ReportFilter) => {
    setReportFilter(filter);
    setCurrentPage(1);
  };

  const updateDraft = (key: keyof FilterState, value: string) =>
    setDraftFilters((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
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
      case "reportStatus":
        return getDisplayStatus(specimen.status, specimen.hasView);
      case "collected":
        return specimen.collected;
      case "received":
        return specimen.received;
      case "reported":
        return specimen.reported;
      case "facility":
        return specimen.facility;
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
      case "race":
        return specimen.race || "Not Specified";
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
      case "downloadPdf":
        return specimen.hasDownload ? (
            <button className="text-link flex items-center gap-1 text-[13px] font-medium">
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            ) : null;
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
            case "action":
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
                <Button variant="outline" size="sm" className="h-7 text-[12px] px-2.5 cursor-pointer">
                  RELEASE
                </Button>
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
                          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            Width
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
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

                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border border-input bg-background hover:bg-accent text-muted-foreground hover:text-primary transition-colors ${showFilters ? "text-primary border-primary" : ""}`}
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
                      variant={reportFilter === "awaiting" ? "default" : "outline"}
                      size="sm"
                      className={`h-9 ${reportFilter === "awaiting" ? "bg-primary text-primary-foreground" : ""}`}
                      onClick={() => handleFilterChange("awaiting")}
                    >
                      <Clock className="h-4 w-4" />
                      Reports Awaiting Release
                    </Button>
                    <Button
                      variant={reportFilter === "released" ? "default" : "outline"}
                      size="sm"
                      className={`h-9 ${reportFilter === "released" ? "bg-primary text-primary-foreground" : ""}`}
                      onClick={() => handleFilterChange("released")}
                    >
                      <FileCheck className="h-4 w-4" />
                      Released Reports
                    </Button>
                    <Button
                      variant={reportFilter === "all" ? "default" : "outline"}
                      size="sm"
                      className={`h-9 ${reportFilter === "all" ? "bg-primary text-primary-foreground" : ""}`}
                      onClick={() => handleFilterChange("all")}
                    >
                      <Files className="h-4 w-4" />
                      All Reports
                    </Button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenImport("specimen")}
                      className="h-9 gap-1.5 cursor-pointer font-medium hover:border-primary/50 transition-colors"
                    >
                      <Upload className="h-4 w-4 text-primary" />
                      Import Specimen
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-1.5 cursor-pointer font-medium hover:border-primary/50 transition-colors"
                        >
                          <FileDown className="h-4 w-4 text-primary" />
                          Import Results
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.csv</span>
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
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.xlsx</span>
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
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.tsv</span>
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

                {(() => {
                  const groups: { key: "collected" | "received" | "reported"; label: string; from: keyof FilterState; to: keyof FilterState }[] = [
                    { key: "collected", label: "Collected", from: "collectedFrom", to: "collectedTo" },
                    { key: "received", label: "Received", from: "receivedFrom", to: "receivedTo" },
                    { key: "reported", label: "Reported", from: "reportedFrom", to: "reportedTo" },
                  ];
                  const activeGroups = groups.filter((g) => appliedFilters[g.from] || appliedFilters[g.to]);
                  if (activeGroups.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {activeGroups.map((g) => {
                        const from = appliedFilters[g.from];
                        const to = appliedFilters[g.to];
                        const range = from && to ? `${from} → ${to}` : from ? `from ${from}` : `until ${to}`;
                        return (
                          <span
                            key={g.key}
                            className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-xs font-medium"
                          >
                            <span>{g.label}: {range}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${g.label} filter`}
                              onClick={() => {
                                const next = { ...appliedFilters, [g.from]: "", [g.to]: "" };
                                setAppliedFilters(next);
                                setDraftFilters((d) => ({ ...d, [g.from]: "", [g.to]: "" }));
                              }}
                              className="hover:text-primary/70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Table */}
                <div className="border border-border rounded-md overflow-auto">
                  <Table className="w-max min-w-full">
                    <TableHeader>
                      <TableRow className="bg-table-header">
                        {visibleColumns.map((col) => {
                          const w = getColWidth(col.id);

                          if (col.id === "downloadPdf") {
                            return (
                              <TableHead
                                key={col.id}
                                style={{ width: `${w}px`, minWidth: `${w}px` }}
                                className="relative group text-[13px] font-medium whitespace-nowrap py-2 px-3 align-middle select-none"
                              >
                                <span className="pr-2">Download PDF</span>
                                {renderResizeHandle(col.id)}
                              </TableHead>
                            );
                          }
                          if (col.id === "exception") {
                            return (
                              <TableHead
                                key={col.id}
                                style={{ width: `${w}px`, minWidth: `${w}px` }}
                                className="relative group text-[13px] font-medium whitespace-nowrap text-center py-2 px-3 align-middle select-none"
                              >
                                <span>Exception</span>
                                {renderResizeHandle(col.id)}
                              </TableHead>
                            );
                          }
                          if (col.id === "action") {
                            return (
                              <TableHead
                                key={col.id}
                                style={{ width: `${w}px`, minWidth: `${w}px` }}
                                className="relative group text-[13px] font-medium whitespace-nowrap py-2 px-3 align-middle select-none"
                              >
                                <span className="pr-2">Action</span>
                                {renderResizeHandle(col.id)}
                              </TableHead>
                            );
                          }
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={Math.max(visibleColumns.length, 1)}
                            className="text-center py-8 text-muted-foreground text-sm"
                          >
                            No specimens found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginated.map((specimen, idx) => (
                          <TableRow key={specimen.id} className="hover:bg-muted/50">
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
