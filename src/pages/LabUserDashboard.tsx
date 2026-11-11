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
  RefreshCw,
  Trash2,
  UserSearch,
  AlertTriangle,
  MoreVertical,
  Pencil,
  Eye,
  Send,
  Flag,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const LOCAL_STORAGE_KEY = "lab_user_table_columns_v7";
const LOCAL_STORAGE_WIDTHS_KEY = "lab_user_column_widths_v2";

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  lcId: 110,
  specimenId: 140,
  reportStatus: 130,
  panelName: 160,
  reportTitle: 160,
  patientName: 160,
  dateOfBirth: 110,
  patientFirstName: 130,
  patientLastName: 130,
  collected: 110,
  received: 110,
  reported: 110,
  facility: 160,
  facilityAddress: 240,
  facilityAddressLine1: 170,
  facilityAddressLine2: 160,
  facilityCity: 130,
  facilityState: 110,
  facilityCountry: 120,
  facilityZip: 110,
  provider: 160,
  providerLocation: 180,
  providerState: 110,
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
  downloadPdf: 140,
  exception: 80,
  action: 70,
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
      localStorage.removeItem("lab_user_table_columns_v6");
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

type ReportFilter =
  | "all"
  | "awaiting-release"
  | "pending-release"
  | "pending"
  | "processing"
  | "failed"
  | "released"
  | "pending-regenerate";

const getDisplayStatus = (status: string, hasView: boolean) => {
  const s = status?.toLowerCase()?.trim();
  if (s === "pending regenerate" || s === "pending-regenerate") return "Pending Regenerate";
  if (s === "failed") return "Failed";
  if (s === "processing") return "Processing";
  if (s === "pending") return "Pending";
  if (s === "awaiting release" || s === "awaiting-release" || s === "pending release" || s === "pending-release") return "Awaiting Release";
  if (hasView || s === "released") return "Released";
  if (s === "new") return "Pending";
  return "Pending";
};

type FilterState = {
  // Patient & Specimen Search options
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  specimenId: string;
  // Date Ranges
  collectedFrom: string;
  collectedTo: string;
  receivedFrom: string;
  receivedTo: string;
  reportedFrom: string;
  reportedTo: string;
  timeZone: string;
};

export const TIME_ZONE_OPTIONS = [
  "ET (UTC-05:00)",
  "CT (UTC-06:00)",
  "MT (UTC-07:00)",
  "PT (UTC-08:00)",
  "AT (UTC-09:00)",
];

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
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    specimenId: "",
    collectedFrom: last30.from,
    collectedTo: last30.to,
    receivedFrom: "",
    receivedTo: "",
    reportedFrom: "",
    reportedTo: "",
    timeZone: "ET (UTC-05:00)",
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

const isAnyDateFilterSet = (filters: FilterState): boolean => {
  return Boolean(
    filters.collectedFrom ||
    filters.collectedTo ||
    filters.receivedFrom ||
    filters.receivedTo ||
    filters.reportedFrom ||
    filters.reportedTo
  );
};

const getAppliedFilterCount = (filters: FilterState): number => {
  let count = 0;
  if (filters.firstName) count++;
  if (filters.lastName) count++;
  if (filters.dateOfBirth) count++;
  if (filters.specimenId) count++;
  if (filters.collectedFrom) count++;
  if (filters.collectedTo) count++;
  if (filters.receivedFrom) count++;
  if (filters.receivedTo) count++;
  if (filters.reportedFrom) count++;
  if (filters.reportedTo) count++;
  return count;
};

const matchDateOfBirth = (specimenDob: string, query: string): boolean => {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const s = (specimenDob || "").trim().toLowerCase();
  if (s.includes(q)) return true;

  const cleanQ = q.replace(/[-.]/g, "/");
  const cleanS = s.replace(/[-.]/g, "/");
  if (cleanS.includes(cleanQ)) return true;

  const parts = cleanQ.split("/");
  if (parts.length === 3 && parts[0].length === 4) {
    const reordered = `${parts[1]}/${parts[2]}/${parts[0]}`;
    if (cleanS.includes(reordered)) return true;
  }
  return false;
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
  const { specimens, updateSpecimen, deleteSpecimen } = useSpecimenContext();
  const [specimenToDelete, setSpecimenToDelete] = useState<Specimen | null>(null);
  const [specimenToUnflag, setSpecimenToUnflag] = useState<Specimen | null>(null);

  const confirmDeleteSpecimen = () => {
    if (!specimenToDelete) return;
    const { id, specimenId, patientFirstName, patientLastName } = specimenToDelete;
    deleteSpecimen(id);
    toast.success(`Specimen ${specimenId} (${patientFirstName} ${patientLastName}) has been deleted.`);
    setSpecimenToDelete(null);
  };

  const confirmUnflagSpecimen = () => {
    if (!specimenToUnflag) return;
    const target = specimenToUnflag;
    updateSpecimen(target.id, { flagged: false });
    toast.info(`Specimen ${target.lcId || target.specimenId} has been unflagged.`);
    setSpecimenToUnflag(null);
  };

  const handleToggleFlag = (specimen: Specimen) => {
    if (specimen.flagged) {
      setSpecimenToUnflag(specimen);
    } else {
      updateSpecimen(specimen.id, { flagged: true });
      toast.success(`Specimen ${specimen.lcId || specimen.specimenId} has been flagged.`);
    }
  };

  const handleReleaseReport = (specimen: Specimen) => {
    updateSpecimen(specimen.id, {
      status: "Released",
      hasView: true,
      hasDownload: true,
      reported: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
    });
    toast.success(`Report for specimen ${specimen.specimenId} has been released!`);
  };

  const handleGenerateReport = (specimen: Specimen) => {
    toast.info(`Generating report for ${specimen.specimenId}...`);
    setTimeout(() => {
      updateSpecimen(specimen.id, {
        status: "Awaiting Release",
        hasDownload: true,
        hasView: false,
        reported: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      });
      toast.success(`Report generated successfully for ${specimen.specimenId}!`);
    }, 800);
  };

  const handleRegenerateReport = (specimen: Specimen) => {
    toast.info(`Regenerating report for ${specimen.specimenId}...`);
    setTimeout(() => {
      updateSpecimen(specimen.id, {
        status: "Awaiting Release",
        hasDownload: true,
        hasView: false,
        reported: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      });
      toast.success(`Report regenerated successfully for ${specimen.specimenId}!`);
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
    .filter((s) => {
      // General search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesGeneral =
          s.specimenId.toLowerCase().includes(q) ||
          `${s.patientFirstName} ${s.patientLastName}`.toLowerCase().includes(q) ||
          `${s.patientLastName}, ${s.patientFirstName}`.toLowerCase().includes(q) ||
          `${s.patientLastName} ${s.patientFirstName}`.toLowerCase().includes(q);
        if (!matchesGeneral) return false;
      }

      // Filter: First Name
      if (appliedFilters.firstName && appliedFilters.firstName.trim()) {
        if (!s.patientFirstName.toLowerCase().includes(appliedFilters.firstName.trim().toLowerCase())) {
          return false;
        }
      }

      // Filter: Last Name
      if (appliedFilters.lastName && appliedFilters.lastName.trim()) {
        if (!s.patientLastName.toLowerCase().includes(appliedFilters.lastName.trim().toLowerCase())) {
          return false;
        }
      }

      // Filter: Date of Birth
      if (appliedFilters.dateOfBirth && appliedFilters.dateOfBirth.trim()) {
        if (!matchDateOfBirth(s.dateOfBirth, appliedFilters.dateOfBirth)) {
          return false;
        }
      }

      // Filter: Specimen ID
      if (appliedFilters.specimenId && appliedFilters.specimenId.trim()) {
        const qId = appliedFilters.specimenId.trim().toLowerCase();
        const matchesSpecimenId =
          s.specimenId.toLowerCase().includes(qId) ||
          (s.lcId && s.lcId.toLowerCase().includes(qId));
        if (!matchesSpecimenId) return false;
      }

      return true;
    })
    .filter((s) => {
      const displayStatus = getDisplayStatus(s.status, s.hasView);
      if (reportFilter === "awaiting-release" || reportFilter === "pending-release") return displayStatus === "Awaiting Release";
      if (reportFilter === "pending") return displayStatus === "Pending";
      if (reportFilter === "processing") return displayStatus === "Processing";
      if (reportFilter === "failed") return displayStatus === "Failed";
      if (reportFilter === "released") return displayStatus === "Released";
      if (reportFilter === "pending-regenerate") return displayStatus === "Pending Regenerate";
      return true;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const isBatchMode = reportFilter === "processing" || reportFilter === "pending-regenerate";
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
          status: "Awaiting Release",
          hasDownload: true,
          hasView: false,
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

  const handleBulkRegenerateReports = () => {
    if (selectedProcessingIds.length === 0) return;
    const count = selectedProcessingIds.length;
    toast.info(`Regenerating reports for ${count} selected specimen(s)...`);
    setTimeout(() => {
      selectedProcessingIds.forEach((id) => {
        updateSpecimen(id, {
          status: "Awaiting Release",
          hasDownload: true,
          hasView: false,
          reported: new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }),
        });
      });
      toast.success(`Successfully regenerated reports for ${count} specimen(s)!`);
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
    if (!isAnyDateFilterSet(draftFilters)) {
      toApply = {
        ...draftFilters,
        collectedFrom: getDefaultFilters().collectedFrom,
        collectedTo: getDefaultFilters().collectedTo,
      };
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
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              {specimen.flagged ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Unflag specimen ${specimen.lcId || specimen.specimenId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlag(specimen);
                      }}
                      className="cursor-pointer text-amber-500 hover:text-amber-600 transition-transform active:scale-90 flex items-center justify-center focus:outline-none"
                    >
                      <Flag className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Click to unflag</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  aria-label={`Flag specimen ${specimen.lcId || specimen.specimenId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFlag(specimen);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-amber-500 transition-opacity cursor-pointer flex items-center justify-center focus:outline-none"
                  title="Click to flag"
                >
                  <Flag className="h-3.5 w-3.5 fill-none" />
                </button>
              )}
            </div>
            <span className="font-medium">{specimen.lcId || "—"}</span>
          </div>
        );
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
        if (displayStatus === "Failed") {
          return <span className="text-destructive font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Awaiting Release") {
          return <span className="text-sky-600 dark:text-sky-400 font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Pending") {
          return <span className="text-amber-600 dark:text-amber-400 font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Processing") {
          return <span className="text-blue-600 dark:text-blue-400 font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Released") {
          return <span className="text-emerald-600 dark:text-emerald-400 font-medium">{displayStatus}</span>;
        }
        if (displayStatus === "Pending Regenerate") {
          return <span className="text-indigo-600 dark:text-indigo-400 font-medium">{displayStatus}</span>;
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
      case "facilityAddress": {
        const line1 = specimen.facilityAddressLine1?.trim();
        const line2 =
          specimen.facilityAddressLine2 && specimen.facilityAddressLine2.trim() !== "—"
            ? specimen.facilityAddressLine2.trim()
            : null;
        const city = specimen.facilityCity?.trim();
        const state = specimen.facilityState?.trim();
        const zip = specimen.facilityZip?.trim();
        const country = specimen.facilityCountry?.trim();

        const stateZip = [state, zip].filter(Boolean).join(" ");
        const parts = [line1, line2, city, stateZip, country].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(", ");
        }
        return specimen.facilityAddress || "—";
      }
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
      case "patientName": {
        const lastName = specimen.patientLastName?.trim();
        const firstName = specimen.patientFirstName?.trim();
        let display = "—";
        if (lastName && firstName) {
          display = `${lastName}, ${firstName}`;
        } else if (lastName || firstName) {
          display = (lastName || firstName)!;
        }
        return <span className="font-medium">{display}</span>;
      }
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
        const displayStatus = getDisplayStatus(specimen.status, specimen.hasView);
        if (displayStatus === "Failed") return null;

        if (displayStatus === "Processing") {
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
        if (displayStatus === "Awaiting Release") {
          return (
            <div className="flex items-center justify-center">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px] px-2.5 font-medium cursor-pointer text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 gap-1.5 transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReleaseReport(specimen);
                }}
              >
                <Send className="h-3.5 w-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                <span>Release report</span>
              </Button>
            </div>
          );
        }
        if (displayStatus === "Pending Regenerate") {
          return (
            <div className="flex items-center justify-center">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px] px-2.5 font-medium cursor-pointer text-indigo-600 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 gap-1.5 transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRegenerateReport(specimen);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 text-indigo-600 group-hover:text-white transition-colors" />
                <span>Regenerate report</span>
              </Button>
            </div>
          );
        }
        if (displayStatus === "Released") {
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
      case "exception": {
        const isFailed = getDisplayStatus(specimen.status, specimen.hasView) === "Failed";
        if (!isFailed) return null;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Exception"
                className="inline-flex items-center justify-center text-destructive hover:opacity-80 cursor-pointer"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm whitespace-normal break-words text-xs leading-relaxed">
              Drug(s) D1,S2 could not be resolved to a valid DrugBank ID. As a result, all requested medications in this request will be excluded from the PDF report.
            </TooltipContent>
          </Tooltip>
        );
      }
      case "action": {
        return (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  aria-label={`Actions for specimen ${specimen.specimenId}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 p-1 rounded-lg shadow-xl border border-border bg-popover">
                <DropdownMenuItem
                  onClick={() => navigate(`/lab-user/specimen/${specimen.id}/edit`)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded text-foreground hover:bg-accent hover:text-white focus:bg-accent focus:text-white transition-colors group"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white group-focus:text-white transition-colors" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/lab-user/specimen/${specimen.id}/report`)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded text-foreground hover:bg-accent hover:text-white focus:bg-accent focus:text-white transition-colors group"
                >
                  <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white group-focus:text-white transition-colors" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => setSpecimenToDelete(specimen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded text-destructive hover:bg-destructive hover:text-white focus:bg-destructive focus:text-white transition-colors group"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive group-hover:text-white group-focus:text-white transition-colors" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {/* Row 1: Search, Filter & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Left: Views, Search, Filter */}
          <div className="flex items-center gap-2.5">
            <ColumnSelector columns={columns} onApply={handleColumnsChange} />

            <Select
              value={reportFilter}
              onValueChange={(val) => handleFilterChange(val as ReportFilter)}
            >
              <SelectTrigger className="w-[185px] h-9 font-medium bg-background border-border">
                <SelectValue placeholder="All Reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">All Reports</SelectItem>
                <SelectItem value="awaiting-release" className="cursor-pointer">Awaiting Release</SelectItem>
                <SelectItem value="pending" className="cursor-pointer">Pending</SelectItem>
                <SelectItem value="processing" className="cursor-pointer">Processing</SelectItem>
                <SelectItem value="failed" className="cursor-pointer">Failed</SelectItem>
                <SelectItem value="released" className="cursor-pointer">Released</SelectItem>
                <SelectItem value="pending-regenerate" className="cursor-pointer">Pending Regenerate</SelectItem>
              </SelectContent>
            </Select>

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
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-1.5 font-medium cursor-pointer transition-colors group ${
                    appliedCount > 0
                      ? "border-primary text-primary bg-primary/5 hover:bg-primary hover:text-white hover:border-primary"
                      : "border-input bg-background text-foreground hover:bg-accent hover:text-white"
                  }`}
                  aria-label="Toggle filters"
                >
                  <Filter className="h-4 w-4 transition-colors group-hover:text-white" />
                  <span>Filters</span>
                  {appliedCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-primary-foreground group-hover:bg-white group-hover:text-primary font-semibold transition-colors">
                      {appliedCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[540px] max-h-[85vh] overflow-y-auto p-5 rounded-2xl shadow-2xl border border-border bg-popover">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-foreground">Filters</h3>
                    {appliedCount > 0 && (
                      <span className="text-xs text-primary font-medium">
                        {appliedCount} {appliedCount === 1 ? "filter" : "filters"} active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2.5 py-1 rounded-md hover:bg-muted"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Section 1: Patient & Specimen Details (Advanced Search) */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <UserSearch className="h-3.5 w-3.5 text-primary" />
                      <span>Patient & Specimen</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">First Name</label>
                        <Input
                          placeholder="First Name..."
                          value={draftFilters.firstName}
                          onChange={(e) => updateDraft("firstName", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                        <Input
                          placeholder="Last Name..."
                          value={draftFilters.lastName}
                          onChange={(e) => updateDraft("lastName", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                        <Input
                          placeholder="MM/DD/YYYY"
                          value={draftFilters.dateOfBirth}
                          onChange={(e) => updateDraft("dateOfBirth", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Specimen ID</label>
                        <Input
                          placeholder="Specimen ID..."
                          value={draftFilters.specimenId}
                          onChange={(e) => updateDraft("specimenId", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtle Divider */}
                  <div className="border-t border-border/50" />

                  {/* Section 2: Date Ranges */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Date Ranges</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Collected From</label>
                        <Input type="date" value={draftFilters.collectedFrom} onChange={(e) => updateDraft("collectedFrom", e.target.value)} className="h-9 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Collected To</label>
                        <Input type="date" value={draftFilters.collectedTo} onChange={(e) => updateDraft("collectedTo", e.target.value)} className="h-9 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Received From</label>
                        <Input type="date" value={draftFilters.receivedFrom} onChange={(e) => updateDraft("receivedFrom", e.target.value)} className="h-9 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Received To</label>
                        <Input type="date" value={draftFilters.receivedTo} onChange={(e) => updateDraft("receivedTo", e.target.value)} className="h-9 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Reported From</label>
                        <Input type="date" value={draftFilters.reportedFrom} onChange={(e) => updateDraft("reportedFrom", e.target.value)} className="h-9 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Reported To</label>
                        <Input type="date" value={draftFilters.reportedTo} onChange={(e) => updateDraft("reportedTo", e.target.value)} className="h-9 text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Subtle Divider */}
                  <div className="border-t border-border/50" />

                  {/* Section 3: Time Zone */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Time Zone</span>
                    </div>
                    <Select
                      value={draftFilters.timeZone || "ET (UTC-05:00)"}
                      onValueChange={(val) => updateDraft("timeZone", val)}
                    >
                      <SelectTrigger className="h-9 text-xs focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Select Time Zone" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border shadow-md">
                        {TIME_ZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz} value={tz} className="text-xs cursor-pointer">
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => { handleApply(); setShowFilters(false); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-7 h-9 text-xs font-medium cursor-pointer shadow-sm"
                  >
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
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

            {reportFilter === "pending-regenerate" && (
              <Button
                variant={selectedProcessingIds.length > 0 ? "default" : "outline"}
                size="sm"
                disabled={selectedProcessingIds.length === 0}
                onClick={handleBulkRegenerateReports}
                className={`h-9 gap-1.5 font-medium transition-all ${selectedProcessingIds.length > 0
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                  : "opacity-50 cursor-not-allowed text-muted-foreground"
                  }`}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate Reports
                {selectedProcessingIds.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] bg-white/20 text-white font-semibold">
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
                    const link = document.createElement("a");
                    link.href = `${import.meta.env.BASE_URL}PGx_Common_Rows_Distinct_Columns.xlsx`;
                    link.setAttribute("download", "PGx_Common_Rows_Distinct_Columns.xlsx");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileDown className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Download Template</span>
                      <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-mono">.xlsx</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Sample PGx specimen Excel template (.xlsx)
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `${import.meta.env.BASE_URL}Panel_Details.xlsx`;
                    link.setAttribute("download", "Panel_Details.xlsx");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Download Panel Details</span>
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded font-mono">.xlsx</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Available test panels & biomarkers (.xlsx)
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

        {/* Row 2: Applied Filters & Time Zone / Environment */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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
                      setAppliedFilters({ ...defaultFilters, timeZone: appliedFilters.timeZone });
                      setDraftFilters({ ...defaultFilters, timeZone: appliedFilters.timeZone });
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
                        if (!isAnyDateFilterSet(next)) {
                          const defaultFilters = getDefaultFilters();
                          setAppliedFilters({ ...defaultFilters, timeZone: appliedFilters.timeZone });
                          setDraftFilters({ ...defaultFilters, timeZone: appliedFilters.timeZone });
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

            {/* Patient & Specimen Filter Pills */}
            {appliedFilters.firstName && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 px-3 py-1 text-xs font-medium text-teal-800 dark:text-teal-300">
                <span>First Name:</span>
                <span className="font-semibold">{appliedFilters.firstName}</span>
                <button
                  type="button"
                  aria-label="Remove First Name filter"
                  onClick={() => {
                    setAppliedFilters((prev) => ({ ...prev, firstName: "" }));
                    setDraftFilters((prev) => ({ ...prev, firstName: "" }));
                  }}
                  className="ml-1 hover:text-teal-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {appliedFilters.lastName && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 px-3 py-1 text-xs font-medium text-teal-800 dark:text-teal-300">
                <span>Last Name:</span>
                <span className="font-semibold">{appliedFilters.lastName}</span>
                <button
                  type="button"
                  aria-label="Remove Last Name filter"
                  onClick={() => {
                    setAppliedFilters((prev) => ({ ...prev, lastName: "" }));
                    setDraftFilters((prev) => ({ ...prev, lastName: "" }));
                  }}
                  className="ml-1 hover:text-teal-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {appliedFilters.dateOfBirth && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 px-3 py-1 text-xs font-medium text-teal-800 dark:text-teal-300">
                <span>DOB:</span>
                <span className="font-semibold">{appliedFilters.dateOfBirth}</span>
                <button
                  type="button"
                  aria-label="Remove DOB filter"
                  onClick={() => {
                    setAppliedFilters((prev) => ({ ...prev, dateOfBirth: "" }));
                    setDraftFilters((prev) => ({ ...prev, dateOfBirth: "" }));
                  }}
                  className="ml-1 hover:text-teal-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {appliedFilters.specimenId && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 px-3 py-1 text-xs font-medium text-teal-800 dark:text-teal-300">
                <span>Specimen ID:</span>
                <span className="font-semibold">{appliedFilters.specimenId}</span>
                <button
                  type="button"
                  aria-label="Remove Specimen ID filter"
                  onClick={() => {
                    setAppliedFilters((prev) => ({ ...prev, specimenId: "" }));
                    setDraftFilters((prev) => ({ ...prev, specimenId: "" }));
                  }}
                  className="ml-1 hover:text-teal-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Time Zone & Environment (Right-aligned metadata cluster) */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-md px-2.5 py-1 select-none shrink-0 h-8">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>Time Zone:</span>
              <span className="font-medium text-foreground">{appliedFilters.timeZone || "ET (UTC-05:00)"}</span>
            </div>

            <Select value={environment || undefined} onValueChange={(v) => setEnvironment(v)}>
              <SelectTrigger className="w-[120px] h-8 text-xs font-medium bg-background border-border">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live" className="text-xs cursor-pointer">Live</SelectItem>
                <SelectItem value="sandbox" className="text-xs cursor-pointer">Sandbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-md overflow-auto">
          <Table className="w-max min-w-full">
            <TableHeader>
              <TableRow className="bg-table-header">
                {isBatchMode && (
                  <TableHead
                    style={{ width: "44px", minWidth: "44px" }}
                    className="text-center py-2 px-3 align-middle select-none"
                  >
                    <Checkbox
                      checked={isAllProcessingSelected ? true : isSomeProcessingSelected ? "indeterminate" : false}
                      onCheckedChange={handleSelectAllProcessing}
                      aria-label="Select all specimens"
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
                {!isBatchMode && (
                  <TableHead
                    style={{ width: `${getColWidth("downloadPdf") || 140}px`, minWidth: "130px" }}
                    className="relative group text-[13px] font-medium whitespace-nowrap text-center py-2 px-3 align-middle select-none border-l border-border/40"
                  >
                    <span className="pr-2">Reports</span>
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
                  style={{ width: `${getColWidth("action") || 70}px`, minWidth: "60px" }}
                  className="relative group text-[13px] font-medium whitespace-nowrap text-center py-2 px-3 align-middle select-none border-l border-border/40"
                >
                  <span className="pr-1">Action</span>
                  {renderResizeHandle("action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (!isBatchMode ? 1 : 0) + 2 + (isBatchMode ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No specimens found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((specimen, idx) => (
                  <TableRow
                    key={specimen.id}
                    className={`group hover:bg-muted/50 ${isBatchMode && selectedProcessingIds.includes(specimen.id)
                      ? "bg-primary/5"
                      : ""
                      }`}
                  >
                    {isBatchMode && (
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
                    {!isBatchMode && (
                      <TableCell
                        style={{ width: `${getColWidth("downloadPdf") || 140}px`, minWidth: "130px" }}
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
                      style={{ width: `${getColWidth("action") || 70}px`, minWidth: "60px" }}
                      className="text-[13px] whitespace-nowrap py-2 px-3 text-center border-l border-border/40"
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
        <div className="relative flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{filtered.length} Specimens</p>

          <div className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground select-none pointer-events-none">
            Version 2.0.3
          </div>

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

      {/* Delete Specimen Confirmation Dialog */}
      <AlertDialog
        open={Boolean(specimenToDelete)}
        onOpenChange={(open) => !open && setSpecimenToDelete(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-destructive mb-1">
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">
                Delete Specimen Details?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This action will remove the specimen details, patient records, accession logs, and all generated reports for{" "}
              <strong className="text-foreground font-semibold">
                {specimenToDelete?.specimenId}
              </strong>{" "}
              ({specimenToDelete?.patientFirstName} {specimenToDelete?.patientLastName}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSpecimen}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium cursor-pointer"
            >
              Delete Specimen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unflag Specimen Confirmation Dialog */}
      <AlertDialog
        open={Boolean(specimenToUnflag)}
        onOpenChange={(open) => !open && setSpecimenToUnflag(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-amber-600 mb-1">
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500">
                <Flag className="h-5 w-5 fill-amber-500 text-amber-500" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">
                Unflag Specimen?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to unflag specimen{" "}
              <strong className="text-foreground font-semibold">
                {specimenToUnflag?.lcId || specimenToUnflag?.specimenId}
              </strong>
              {specimenToUnflag?.patientFirstName ? (
                <> ({specimenToUnflag.patientFirstName} {specimenToUnflag.patientLastName})</>
              ) : null}
              ? This will remove the attention flag from this specimen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnflagSpecimen}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer shadow-sm"
            >
              Unflag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LabUserDashboard;
