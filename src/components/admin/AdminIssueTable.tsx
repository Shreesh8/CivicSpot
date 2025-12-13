import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Issue, IssueCategory, IssueStatus, useIssues } from "@/contexts/IssueContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminIssueTable = () => {
  const { issues, updateIssue } = useIssues();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-civic-yellow text-black">In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-civic-green text-white">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleStatusChange = (issueId: string, newStatus: IssueStatus) => {
    updateIssue(issueId, { status: newStatus });
  };

  const columns: ColumnDef<Issue>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="text-xs font-mono">#{row.original.id}</span>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link to={`/issue/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("title")}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => formatCategory(row.getValue("category")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              {getStatusBadge(row.original.status)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover z-50">
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                handleStatusChange(row.original.id, "open");
              }}
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                handleStatusChange(row.original.id, "in_progress");
              }}
            >
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                handleStatusChange(row.original.id, "resolved");
              }}
            >
              Resolved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      accessorKey: "reporterName",
      header: "Reporter",
    },
    {
      accessorKey: "createdAt",
      header: "Date Reported",
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM dd, yyyy"),
    },
    {
      accessorKey: "location.address",
      header: "Location",
      cell: ({ row }) => {
        const address = row.original.location.address;
        return address ? address : `${row.original.location.latitude.toFixed(6)}, ${row.original.location.longitude.toFixed(6)}`;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link to={`/issue/${row.original.id}`}>
          <Button variant="ghost" size="sm">View</Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleCategoryFilterChange = (value: string) => {
    if (value === "all") {
      table.getColumn("category")?.setFilterValue(undefined);
    } else {
      table.getColumn("category")?.setFilterValue(value);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              className="pl-8"
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select 
            onValueChange={handleCategoryFilterChange}
            defaultValue="all"
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="road_damage">Road Damage</SelectItem>
              <SelectItem value="sanitation">Sanitation</SelectItem>
              <SelectItem value="lighting">Lighting</SelectItem>
              <SelectItem value="graffiti">Graffiti</SelectItem>
              <SelectItem value="sidewalk">Sidewalk</SelectItem>
              <SelectItem value="vegetation">Vegetation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            onValueChange={handleStatusFilterChange}
            defaultValue="all"
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-1"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <strong>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </strong>{" "}
          of <strong>{table.getFilteredRowModel().rows.length}</strong> issues
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminIssueTable;
