import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BusinessTable from "@/components/BusinessTable";
import SearchInput from "@/components/SearchInput";
import { useBusinessContext } from "@/context/BusinessContext";
import emgenexLogo from "@/assets/emgenex-logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BusinessListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"assigned" | "all">("assigned");
  const navigate = useNavigate();
  const { businesses } = useBusinessContext();

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const query = searchQuery.toLowerCase();
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.executiveName.toLowerCase().includes(query) ||
        b.address.toLowerCase().includes(query) ||
        b.email.toLowerCase().includes(query)
    );
  }, [businesses, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <img src={emgenexLogo} alt="Emgenex LIS" className="h-4" />
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Business Listing</h1>
            <p className="text-muted-foreground mt-1">Create and manage businesses</p>
          </div>
          <Button
            onClick={() => navigate("/add-business")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Add business
          </Button>
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

        <BusinessTable
          businesses={filteredBusinesses}
          onEdit={(business) => navigate(`/edit-business/${business.id}`)}
        />
      </div>
    </div>
  );
};

export default BusinessListing;
