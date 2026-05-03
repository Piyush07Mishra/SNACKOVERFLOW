'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { Search, Filter, Eye, Edit2, Calendar } from "lucide-react";
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  userName?: string;
  userEmail?: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalWorkingHours: string;
  breaks: Array<{ start: string; end: string }>;
  notes?: string;
  employeeId?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  isAdmin?: boolean;
  onEditRecord?: (record: AttendanceRecord) => void;
  onViewDetails?: (record: AttendanceRecord) => void;
}

export function AttendanceTable({ 
  records, 
  isAdmin = false, 
  onEditRecord,
  onViewDetails 
}: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter and sort records
  const filteredRecords = records
    .filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof AttendanceRecord];
      let bValue: any = b[sortBy as keyof AttendanceRecord];
      
      if (sortBy === 'date') {
        aValue = new Date(a.date);
        bValue = new Date(b.date);
      } else if (sortBy === 'totalWorkingHours') {
        aValue = parseFloat(a.totalWorkingHours) || 0;
        bValue = parseFloat(b.totalWorkingHours) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to page 1 when filters or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'default';
      case 'Absent': return 'destructive';
      case 'Half_Day': return 'secondary';
      case 'Leave': return 'outline';
      default: return 'default';
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const calculateStats = () => {
    const stats = {
      total: filteredRecords.length,
      present: filteredRecords.filter(r => r.status === 'Present').length,
      absent: filteredRecords.filter(r => r.status === 'Absent').length,
      halfDay: filteredRecords.filter(r => r.status === 'Half_Day').length,
      leave: filteredRecords.filter(r => r.status === 'Leave').length,
      totalHours: filteredRecords.reduce((sum, r) => sum + (parseFloat(r.totalWorkingHours) || 0), 0)
    };
    return stats;
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.halfDay}</div>
            <div className="text-sm text-muted-foreground">Half Day</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.leave}</div>
            <div className="text-sm text-muted-foreground">Leave</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            View and manage attendance records
            {stats.totalHours > 0 && ` • Total Hours: ${stats.totalHours.toFixed(1)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by date, name, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Half_Day">Half Day</SelectItem>
                <SelectItem value="Leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('date')}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  {isAdmin && (
                    <>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee ID</TableHead>
                    </>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('totalWorkingHours')}
                  >
                    Hours {sortBy === 'totalWorkingHours' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Breaks</TableHead>
                  <TableHead>Notes</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{record.date}</TableCell>
                    {isAdmin && (
                      <>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{record.userName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{record.userEmail || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{record.employeeId || 'N/A'}</span>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge variant={getStatusColor(record.status)}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{record.totalWorkingHours}</span>
                        <span className="text-xs text-muted-foreground">hrs</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-[120px]">
                        {record.breaks.length > 0 ? record.breaks.map((b, i) => (
                          <span key={i} className="text-xs text-muted-foreground">
                            {b.start} - {b.end}
                          </span>
                        )) : <span className="text-xs text-muted-foreground italic">No breaks</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {record.notes ? (
                          <p className="text-sm truncate" title={record.notes}>
                            {record.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No notes</span>
                        )}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails?.(record)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRecord?.(record)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {paginatedRecords.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={isAdmin ? 10 : 7} 
                      className="text-center py-10 text-muted-foreground italic"
                    >
                      No attendance records found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredRecords.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredRecords.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
