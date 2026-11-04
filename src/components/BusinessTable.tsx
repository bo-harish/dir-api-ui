import { useNavigate } from "react-router-dom";
import { Business } from "@/types/business";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Pencil } from "lucide-react";

interface BusinessTableProps {
  businesses: Business[];
  onEdit: (business: Business) => void;
}

const BusinessTable = ({ businesses, onEdit }: BusinessTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-table-header hover:bg-table-header">
            <TableHead className="text-foreground font-medium">
              <div className="flex items-center gap-1 cursor-pointer">
                Business Name <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-medium">
              <div className="flex items-center gap-1 cursor-pointer">
                Executive Name <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-medium">
              <div className="flex items-center gap-1 cursor-pointer">
                Phone <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-medium">
              <div className="flex items-center gap-1 cursor-pointer">
                Email <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-medium text-center">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {businesses.map((business) => (
            <TableRow
              key={business.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(`/edit-business/${business.id}`)}
            >
              <TableCell className="text-primary font-medium">
                {business.name}
              </TableCell>
              <TableCell className="text-foreground">
                {business.executiveName}
              </TableCell>
              <TableCell className="text-foreground">
                {business.phone}
              </TableCell>
              <TableCell className="text-foreground">
                {business.email}
              </TableCell>
              <TableCell className="text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(business);
                  }}
                  className="text-primary hover:text-primary/80 inline-flex items-center justify-center"
                  title="Edit Business"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BusinessTable;
