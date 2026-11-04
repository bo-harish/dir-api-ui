import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, CalendarIcon, FileSpreadsheet, Check } from "lucide-react";
import { format } from "date-fns";
import emgenexLogo from "@/assets/emgenex-logo.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { mockBusinessSummaries, mockApiDetails } from "@/data/mockDashboardData";
import SearchInput from "@/components/SearchInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DateRange } from "react-day-picker";

const Dashboard = () => {
  const navigate = useNavigate();
  const [environmentFilter, setEnvironmentFilter] = useState<"live" | "sandbox">("live");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem("dashboard-expanded-rows");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"assigned" | "all">("assigned");

  // Persist expanded rows to sessionStorage
  const updateExpandedRows = (newSet: Set<string>) => {
    setExpandedRows(newSet);
    sessionStorage.setItem("dashboard-expanded-rows", JSON.stringify([...newSet]));
  };

  const filteredData = useMemo(() => {
    return mockBusinessSummaries.filter(
      (business) => business.environment === environmentFilter
    );
  }, [environmentFilter]);

  const toggleRow = (businessId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(businessId)) {
      newSet.delete(businessId);
    } else {
      newSet.add(businessId);
    }
    updateExpandedRows(newSet);
  };

  const handleApiRowClick = (
    businessId: string,
    businessName: string,
    apiName: string,
    success: number,
    failed: number
  ) => {
    navigate(`/api-access-details/${businessId}`, {
      state: {
        businessName,
        environment: environmentFilter,
        apiName,
        success,
        failed,
      },
    });
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date";
    if (!dateRange.to) return format(dateRange.from, "MMM dd, yyyy");
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Logo */}
      <div className="mb-6">
        <img src={emgenexLogo} alt="Emgenex LIS" className="h-4" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of business performance and API usage statistics.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-semibold">Environment:</span>
            <Select
              value={environmentFilter}
              onValueChange={(value: "live" | "sandbox") => setEnvironmentFilter(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-semibold">Date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            size="sm"
            onClick={() => {
              // Apply the selected date range filter
              console.log("Date range applied:", dateRange);
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search Business" />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as "assigned" | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assigned">Assigned to me</SelectItem>
            <SelectItem value="all">All Businesses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-bold text-foreground">Business Name</TableHead>
              <TableHead className="font-bold text-foreground text-right">Reports Generated</TableHead>
              <TableHead className="font-bold text-foreground text-right">Reports Regenerated</TableHead>
              <TableHead className="font-bold text-foreground text-right">Failed</TableHead>
              <TableHead className="font-bold text-foreground text-right">Specimen Count</TableHead>
              <TableHead className="font-bold text-foreground text-center">Export</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-semibold">
                  No businesses found for {environmentFilter} environment.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((business) => {
                const isExpanded = expandedRows.has(business.id);
                const apiDetails = mockApiDetails[business.id] || [];
                const specimenCount = business.reportsGenerated + business.failed;
                
                return (
                  <>
                    <TableRow key={business.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleRow(business.id)}
                        >
                          {isExpanded ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-primary font-medium">{business.businessName}</TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {business.reportsGenerated.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {business.reportsRegenerated.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-destructive">
                        {business.failed.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">{specimenCount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <button
                          className="text-primary hover:text-primary/80 inline-flex items-center justify-center"
                          title="Export to Excel"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${business.id}-details`} className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 bg-muted/20">
                        
                          <div className="px-8 py-4 pl-16">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="font-bold text-foreground pl-8">API Name</TableHead>
                                  <TableHead className="font-bold text-foreground text-right">Times Accessed</TableHead>
                                  <TableHead className="font-bold text-foreground text-right">Success</TableHead>
                                  <TableHead className="font-bold text-foreground text-right">Failed</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TooltipProvider>
                                {apiDetails.map((api, index) => {
                                  const timesAccessed = api.success + api.failed;
                                  return (
                                    <Tooltip key={index}>
                                      <TooltipTrigger asChild>
                                        <TableRow
                                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                                          onClick={() =>
                                            handleApiRowClick(
                                              business.id,
                                              business.businessName,
                                              api.apiName,
                                              api.success,
                                              api.failed
                                            )
                                          }
                                        >
                                          <TableCell className="pl-8">{api.apiName}</TableCell>
                                          <TableCell className="text-right font-bold">{timesAccessed.toLocaleString()}</TableCell>
                                          <TableCell className="text-right font-bold text-success">{api.success}</TableCell>
                                          <TableCell className="text-right font-bold text-destructive">{api.failed}</TableCell>
                                        </TableRow>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Click for more details.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                                </TooltipProvider>
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Dashboard;
