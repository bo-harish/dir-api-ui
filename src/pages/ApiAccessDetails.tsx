import { useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, Activity, CheckCircle2, XCircle, CalendarRange, Search } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiAccessRecords } from "@/data/mockDashboardData";
import { cn } from "@/lib/utils";

type SortField = "time" | "count" | "status";
type SortDir = "asc" | "desc";

const ApiAccessDetails = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { businessName, environment, apiName, success, failed } = location.state || {};
  const timesAccessed = success + failed;

  const records = getApiAccessRecords(businessId || "", apiName, success, failed);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [reasonQuery, setReasonQuery] = useState<string>("");

  const getCount = (r: any): number =>
    r.specimenCount ?? r.medicationCount ?? r.reportsGenerated ?? 0;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasCountColumn = apiName === "Upload Results API" || apiName === "Reporting API" || apiName === "SearchMedications API";

  const countLabel =
    apiName === "Upload Results API"
      ? "Specimen Count"
      : apiName === "Reporting API"
      ? "Reports Generated"
      : apiName === "SearchMedications API"
      ? "Medication Count"
      : "Count";

  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status.toLowerCase() === statusFilter);
    }
    if (reasonQuery.trim()) {
      const q = reasonQuery.trim().toLowerCase();
      list = list.filter((r) => (r.reason || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let av: any;
      let bv: any;
      if (sortField === "time") {
        av = new Date(a.time).getTime();
        bv = new Date(b.time).getTime();
      } else if (sortField === "count") {
        av = getCount(a);
        bv = getCount(b);
      } else {
        av = a.status;
        bv = b.status;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [records, statusFilter, reasonQuery, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  const SortableHead = ({
    field,
    children,
    align = "left",
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: "left" | "right";
  }) => (
    <TableHead className={cn("font-bold text-foreground", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={cn(
          "inline-flex items-center hover:text-primary transition-colors",
          align === "right" && "ml-auto"
        )}
      >
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  const renderTableHeaders = () => {
    switch (apiName) {
      case "Upload Results API":
        return (
          <>
            <SortableHead field="time">Time</SortableHead>
            <TableHead className="font-bold text-foreground">IP Address</TableHead>
            <SortableHead field="count" align="right">Specimen Count</SortableHead>
            <SortableHead field="status" align="right">Status</SortableHead>
            <TableHead className="font-bold text-foreground">Reason</TableHead>
          </>
        );
      case "Reporting API":
        return (
          <>
            <SortableHead field="time">Time</SortableHead>
            <TableHead className="font-bold text-foreground">IP Address</TableHead>
            <SortableHead field="count" align="right">Reports Generated</SortableHead>
            <TableHead className="font-bold text-foreground text-right">Reports Regenerated</TableHead>
            <TableHead className="font-bold text-foreground">Gene Panel</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugBankCalls</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugsQueried</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugsMatched</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugsNotMatched</TableHead>
            <SortableHead field="status" align="right">Status</SortableHead>
            <TableHead className="font-bold text-foreground">Reason</TableHead>
          </>
        );
      case "SearchMedications API":
        return (
          <>
            <SortableHead field="time">Time</SortableHead>
            <TableHead className="font-bold text-foreground">IP Address</TableHead>
            <SortableHead field="count" align="right">Medication Count</SortableHead>
            <TableHead className="font-bold text-foreground text-right">DrugBankCalls</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugsQueried</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugsMatched</TableHead>
            <TableHead className="font-bold text-foreground text-right">DrugsNotMatched</TableHead>
            <SortableHead field="status" align="right">Status</SortableHead>
            <TableHead className="font-bold text-foreground">Reason</TableHead>
          </>
        );
      case "GetPDFReport API":
      case "PendingRegeneration API":
      case "GetReports API":
      default:
        return (
          <>
            <SortableHead field="time">Time</SortableHead>
            <TableHead className="font-bold text-foreground">IP Address</TableHead>
            <SortableHead field="status" align="right">Status</SortableHead>
            <TableHead className="font-bold text-foreground">Reason</TableHead>
          </>
        );
    }
  };

  const renderTableRow = (record: ReturnType<typeof getApiAccessRecords>[0]) => {
    const statusClass = record.status === "Success" ? "text-success" : "text-destructive";
    const formattedTime = format(new Date(record.time), "MMM dd, yyyy HH:mm:ss");

    const reasonCell = record.status === "Failed" ? (
      <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={record.reason}>
        {record.reason || "-"}
      </TableCell>
    ) : (
      <TableCell className="text-muted-foreground">-</TableCell>
    );

    switch (apiName) {
      case "Upload Results API":
        return (
          <>
            <TableCell>{formattedTime}</TableCell>
            <TableCell>{record.ipAddress}</TableCell>
            <TableCell className="text-right">{record.specimenCount}</TableCell>
            <TableCell className={`text-right ${statusClass}`}>{record.status}</TableCell>
            {reasonCell}
          </>
        );
      case "Reporting API":
        return (
          <>
            <TableCell>{formattedTime}</TableCell>
            <TableCell>{record.ipAddress}</TableCell>
            <TableCell className="text-right">{record.reportsGenerated}</TableCell>
            <TableCell className="text-right">{record.reportsRegenerated}</TableCell>
            <TableCell>{record.genePanel}</TableCell>
            <TableCell className="text-right">{record.drugBankCalls}</TableCell>
            <TableCell className="text-right">{record.drugsQueried}</TableCell>
            <TableCell className="text-right">{record.drugsMatched}</TableCell>
            <TableCell className="text-right">{record.drugsNotMatched}</TableCell>
            <TableCell className={`text-right ${statusClass}`}>{record.status}</TableCell>
            {reasonCell}
          </>
        );
      case "SearchMedications API":
        return (
          <>
            <TableCell>{formattedTime}</TableCell>
            <TableCell>{record.ipAddress}</TableCell>
            <TableCell className="text-right">{record.medicationCount}</TableCell>
            <TableCell className="text-right">{record.drugBankCalls}</TableCell>
            <TableCell className="text-right">{record.drugsQueried}</TableCell>
            <TableCell className="text-right">{record.drugsMatched}</TableCell>
            <TableCell className="text-right">{record.drugsNotMatched}</TableCell>
            <TableCell className={`text-right ${statusClass}`}>{record.status}</TableCell>
            {reasonCell}
          </>
        );
      case "GetPDFReport API":
      case "PendingRegeneration API":
      case "GetReports API":
      default:
        return (
          <>
            <TableCell>{formattedTime}</TableCell>
            <TableCell>{record.ipAddress}</TableCell>
            <TableCell className={`text-right ${statusClass}`}>{record.status}</TableCell>
            {reasonCell}
          </>
        );
    }
  };

  if (!businessName || !apiName) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-muted-foreground font-bold">No data available. Please navigate from the Dashboard.</p>
        <Button variant="outline" className="mt-4 hover:bg-accent hover:text-white cursor-pointer" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const environmentLabel = environment === "live" ? "Live" : "Sandbox";
  const successRate = timesAccessed > 0 ? Math.round((success / timesAccessed) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 -ml-2 hover:bg-accent hover:text-white cursor-pointer" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {businessName} - {environmentLabel} Environment API access details
        </h1>
      </div>

      {/* API Summary Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">{apiName}</h2>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 border border-border">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="font-medium">Jun 1, 2026 – Jun 10, 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Times Accessed */}
          <div className="relative overflow-hidden rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Times Accessed</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{timesAccessed}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Success */}
          <div className="relative overflow-hidden rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-success" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Success</p>
                <p className="mt-1 text-3xl font-bold text-success">{success}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{successRate}% success rate</p>
              </div>
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="relative overflow-hidden rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-destructive" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Failed</p>
                <p className="mt-1 text-3xl font-bold text-destructive">{failed}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{100 - successRate}% failure rate</p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background rounded-md p-4 mb-4 border border-border flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Search by Reason</label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setReasonQuery(reasonInput);
              }}
              placeholder="Search..."
              className="w-[240px]"
            />
            <Button type="button" onClick={() => setReasonQuery(reasonInput)}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {reasonQuery && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setReasonInput("");
                  setReasonQuery("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground ml-auto">
          Click column headers to sort{hasCountColumn ? " by Time, " + countLabel + ", or Status" : " by Time or Status"}.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {renderTableHeaders()}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground font-bold">
                  No access records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                  {renderTableRow(record)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ApiAccessDetails;
