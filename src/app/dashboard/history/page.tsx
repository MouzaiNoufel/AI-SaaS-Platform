'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface AIRequest {
  id: string;
  input: string;
  status: string;
  result?: Record<string, unknown>;
  error?: string;
  processingTime?: number;
  tokensUsed?: number;
  createdAt: string;
  tool: {
    name: string;
    slug: string;
  };
}

export default function HistoryPage() {
  const [requests, setRequests] = useState<AIRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AIRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<AIRequest | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/requests?limit=100');
      const data = await res.json();
      setRequests(data.data || []);
      setFilteredRequests(data.data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load request history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    let result = requests;

    if (searchQuery) {
      result = result.filter(
        (req) =>
          req.tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.input.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(result);
  }, [searchQuery, statusFilter, requests]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/requests/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to delete request');
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedRequest(null);
      toast({
        title: 'Deleted',
        description: 'Request has been deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete request',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PROCESSING':
        return <Badge>Processing</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request History</h1>
          <p className="text-muted-foreground">
            View and manage your past AI requests
          </p>
        </div>
        <Button variant="outline" onClick={fetchRequests} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tool or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <TableSkeleton />
      ) : filteredRequests.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/tools/${request.tool.slug}`}
                          className="font-medium hover:text-primary"
                        >
                          {request.tool.name}
                        </Link>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                        {request.input}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(request.createdAt))}
                        {request.processingTime && (
                          <span className="ml-2">
                            • {(request.processingTime / 1000).toFixed(2)}s
                          </span>
                        )}
                        {request.tokensUsed && (
                          <span className="ml-2">• {request.tokensUsed} tokens</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No requests found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start using AI tools to see your history here'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.tool.name} Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && formatDate(new Date(selectedRequest.createdAt))}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Status</h4>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Input</h4>
                <div className="mt-1 rounded-lg bg-muted p-3 text-sm">
                  {selectedRequest.input}
                </div>
              </div>
              {selectedRequest.result && (
                <div>
                  <h4 className="text-sm font-medium">Output</h4>
                  <div className="mt-1 max-h-64 overflow-auto rounded-lg bg-muted p-3 text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedRequest.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedRequest.error && (
                <div>
                  <h4 className="text-sm font-medium text-destructive">Error</h4>
                  <div className="mt-1 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {selectedRequest.error}
                  </div>
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                {selectedRequest.processingTime && (
                  <span>Processing time: {(selectedRequest.processingTime / 1000).toFixed(2)}s</span>
                )}
                {selectedRequest.tokensUsed && (
                  <span>Tokens used: {selectedRequest.tokensUsed}</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
