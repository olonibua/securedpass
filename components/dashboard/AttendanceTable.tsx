'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, Loader2,  } from 'lucide-react';
import { DATABASE_ID, CUSTOMFIELDS_COLLECTION_ID, MEMBERS_COLLECTION_ID, CHECKINS_COLLECTION_ID, databases, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CustomField } from '@/types';

interface AttendanceTableProps {
  organizationId: string;
}

export default function AttendanceTable({ organizationId }: AttendanceTableProps) {
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<Record<string, unknown>[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [members, setMembers] = useState<Record<string, Record<string, unknown>>>({});
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [exportLoading, setExportLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      
      // Build query filters
      const filters = [
        Query.equal('organizationId', organizationId),
        Query.orderDesc('timestamp'),
        Query.limit(ITEMS_PER_PAGE),
        Query.offset((page - 1) * ITEMS_PER_PAGE)
      ];
      
      // Add date range filter if set
      if (dateRange.from) {
        filters.push(
          Query.greaterThanEqual('timestamp', dateRange.from.toISOString())
        );
      }
      
      if (dateRange.to) {
        // Add one day to include the end date fully
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        filters.push(
          Query.lessThan('timestamp', endDate.toISOString())
        );
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID!,
        CHECKINS_COLLECTION_ID!,
        filters
      );
      
      setCheckIns(response.documents);
      
      // Calculate total pages
      const totalResponse = await databases.listDocuments(
        DATABASE_ID!,
        CHECKINS_COLLECTION_ID!,
        [Query.equal('organizationId', organizationId)]
      );
      
      setTotalPages(Math.ceil(totalResponse.total / ITEMS_PER_PAGE));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch check-ins';
      console.error('Error fetching check-ins:', errorMessage);
      toast.error('Failed to load check-in data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch custom fields
        const fieldsResponse = await databases.listDocuments(
          DATABASE_ID!,
          CUSTOMFIELDS_COLLECTION_ID!,
          [
            Query.equal('organizationId', organizationId),
            Query.orderAsc('order')
          ]
        );
        setCustomFields(fieldsResponse.documents as unknown as CustomField[]);
        
        // Fetch members for this organization
        const membersResponse = await databases.listDocuments(
          DATABASE_ID!,
          MEMBERS_COLLECTION_ID!,
          [Query.equal('organizationId', organizationId)]
        );
        
        // Create a map of member IDs to member data for quick lookup
        const membersMap = membersResponse.documents.reduce((acc, member) => {
          acc[member.$id] = member;
          return acc;
        }, {} as Record<string, Record<string, unknown>>);
        
        setMembers(membersMap);
        
        // Fetch check-ins with pagination and filters
        await fetchCheckIns();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
        console.error('Error fetching data:', errorMessage);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  useEffect(() => {
    fetchCheckIns();
  }, [page, dateRange, organizationId, fetchCheckIns]);

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      
      // Fetch all check-ins for export (potentially with date filters)
      const filters = [
        Query.equal('organizationId', organizationId),
        Query.orderDesc('timestamp'),
        Query.limit(5000) // Set a reasonable limit
      ];
      
      if (dateRange.from) {
        filters.push(
          Query.greaterThanEqual('timestamp', dateRange.from.toISOString())
        );
      }
      
      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        filters.push(
          Query.lessThan('timestamp', endDate.toISOString())
        );
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID!,
        CHECKINS_COLLECTION_ID!,
        filters
      );
      
      // Prepare CSV headers
      const headers = [
        'Check-in ID',
        'Date & Time',
        'Member ID',
        ...customFields.map(field => field.name)
      ];
      
      // Prepare CSV rows
      const rows = response.documents.map(checkIn => {
        const row = [
          checkIn.$id,
          new Date(checkIn.timestamp).toLocaleString(),
          checkIn.memberId || 'Guest'
        ];
        
        // Add custom field values
        customFields.forEach(field => {
          const value = checkIn.customFieldValues[field.$id] || '';
          row.push(value);
        });
        
        return row;
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `check-ins-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      console.error('Error exporting data:', errorMessage);
      toast.error('Failed to export attendance data');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Attendance Records</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange({
                      from: range.from,
                      to: range.to || undefined
                    });
                  } else {
                    setDateRange({ from: undefined, to: undefined });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : checkIns.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No check-in records found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Member</TableHead>
                {customFields.map(field => (
                  <TableHead key={field.$id}>{field.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns.map(checkIn => (
                <TableRow key={checkIn.$id as string}>
                  <TableCell className="font-medium">
                    {new Date(checkIn.timestamp as string).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {(checkIn.memberId as string | undefined) && members[checkIn.memberId as string] 
                      ? (members[checkIn.memberId as string].name as string) || (members[checkIn.memberId as string].email as string)
                      : 'Guest'}
                  </TableCell>
                  {customFields.map(field => (
                    <TableCell key={field.$id}>
                      {(checkIn.customFieldValues as Record<string, string>)[field.$id] || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {page === 1 || loading ? (
                <PaginationPrevious className="pointer-events-none opacity-50" />
              ) : (
                <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} />
              )}
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  {loading ? (
                    <PaginationLink
                      isActive={pageNum === page}
                      className="pointer-events-none opacity-50"
                    >
                      {pageNum}
                    </PaginationLink>
                  ) : (
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              {page === totalPages || loading ? (
                <PaginationNext className="pointer-events-none opacity-50" />
              ) : (
                <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
