import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockUsers } from "@/data/mockUsers";
import { User } from "@/types/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UsersTab = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [users] = useState<User[]>(mockUsers);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Lab Users</h2>
        <p className="text-muted-foreground mt-1">Create and manage lab users</p>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search User"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Users</SelectItem>
            <SelectItem value="inactive">Inactive Users</SelectItem>
            <SelectItem value="all">All Users</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => navigate(`/edit-business/${businessId}/add-user`)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Add Lab User
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-foreground font-medium">
                <div className="flex items-center gap-1 cursor-pointer">
                  First Name <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <div className="flex items-center gap-1 cursor-pointer">
                  Last Name <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <div className="flex items-center gap-1 cursor-pointer">
                  Email <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                Phone Number
              </TableHead>
              <TableHead className="text-foreground font-medium text-center">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="text-foreground">{user.firstName}</TableCell>
                <TableCell className="text-foreground">{user.lastName}</TableCell>
                <TableCell className="text-primary font-medium">{user.email}</TableCell>
                <TableCell className="text-foreground">{user.phone}</TableCell>
                
                <TableCell className="text-center">
                  <button
                    onClick={() => navigate(`/edit-business/${businessId}/edit-user/${user.id}`)}
                    className="text-primary hover:text-primary/80 inline-flex items-center justify-center"
                    title="Edit User"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary font-medium">{filteredUsers.length} Users</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90">
            1
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsersTab;
