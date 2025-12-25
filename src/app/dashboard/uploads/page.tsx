'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  File,
  FileText,
  Image,
  Table,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Sparkles,
  Download,
} from 'lucide-react';

interface UploadItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: string;
  status: string;
  extractedText: string | null;
  metadata: Record<string, unknown> | null;
  aiAnalysis: Record<string, unknown> | null;
  createdAt: string;
  processedAt: string | null;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState('summary');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const response = await fetch('/api/uploads');
      const data = await response.json();
      if (response.ok) {
        setUploads(data.uploads);
      }
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Success',
            description: `${file.name} uploaded successfully`,
          });
          fetchUploads();
        } else {
          toast({
            title: 'Error',
            description: data.error || `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Error',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'File deleted successfully',
        });
        fetchUploads();
        if (selectedUpload?.id === id) {
          setShowDetailsDialog(false);
          setSelectedUpload(null);
        }
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedUpload) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`/api/uploads/${selectedUpload.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data.analysis);
        toast({
          title: 'Success',
          description: 'Analysis completed',
        });
        fetchUploads(); // Refresh to get updated aiAnalysis
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Analysis failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze file',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const openDetails = (upload: UploadItem) => {
    setSelectedUpload(upload);
    setAnalysisResult(null);
    setShowDetailsDialog(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'IMAGE':
        return <Image className="h-6 w-6 text-blue-500" />;
      case 'DOCUMENT':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'SPREADSHEET':
        return <Table className="h-6 w-6 text-green-500" />;
      case 'TEXT':
        return <FileText className="h-6 w-6 text-gray-500" />;
      default:
        return <File className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const filteredUploads = uploads.filter((upload) => {
    const matchesType = filterType === 'all' || upload.type === filterType;
    const matchesSearch = upload.originalName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const storageUsed = uploads.reduce((acc, u) => acc + u.size, 0);
  const storageLimit = 100 * 1024 * 1024; // 100MB
  const storagePercent = (storageUsed / storageLimit) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Uploads</h1>
          <p className="text-muted-foreground">
            Upload and analyze files with AI
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Storage Usage */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Storage Used</span>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
            </span>
          </div>
          <Progress value={storagePercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PDF">PDFs</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="DOCUMENT">Documents</SelectItem>
            <SelectItem value="SPREADSHEET">Spreadsheets</SelectItem>
            <SelectItem value="TEXT">Text Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File List */}
      {filteredUploads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Files Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload files to analyze them with AI
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUploads.map((upload) => (
            <Card
              key={upload.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openDetails(upload)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(upload.type)}
                  <div>
                    <h3 className="font-medium">{upload.originalName}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatFileSize(upload.size)}</span>
                      <span>-</span>
                      <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(upload.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetails(upload);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(upload.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUpload?.originalName}</DialogTitle>
            <DialogDescription>
              File details and AI analysis
            </DialogDescription>
          </DialogHeader>

          {selectedUpload && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="analyze">AI Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">File Type</label>
                    <p className="font-medium">{selectedUpload.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Size</label>
                    <p className="font-medium">{formatFileSize(selectedUpload.size)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">MIME Type</label>
                    <p className="font-medium">{selectedUpload.mimeType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUpload.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Uploaded</label>
                    <p className="font-medium">
                      {new Date(selectedUpload.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedUpload.processedAt && (
                    <div>
                      <label className="text-sm text-muted-foreground">Processed</label>
                      <p className="font-medium">
                        {new Date(selectedUpload.processedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedUpload.metadata && (
                  <div>
                    <label className="text-sm text-muted-foreground">Metadata</label>
                    <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedUpload.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="content">
                {selectedUpload.extractedText ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Extracted Content
                      </label>
                      <Badge variant="outline">
                        {selectedUpload.extractedText.length} characters
                      </Badge>
                    </div>
                    <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {selectedUpload.extractedText}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No content extracted yet</p>
                    <p className="text-sm">
                      {selectedUpload.status === 'PROCESSING'
                        ? 'File is being processed...'
                        : selectedUpload.status === 'FAILED'
                        ? 'Content extraction failed'
                        : 'Content will be extracted when processing completes'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analyze" className="space-y-4">
                <div className="flex items-center gap-3">
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="keyPoints">Key Points</SelectItem>
                      <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                      <SelectItem value="entities">Entity Extraction</SelectItem>
                      <SelectItem value="questions">Generate Questions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAnalyze}
                    disabled={
                      analyzing ||
                      selectedUpload.status !== 'COMPLETED' ||
                      !selectedUpload.extractedText
                    }
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>

                {analysisResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm">
                        {analysisResult}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {selectedUpload.aiAnalysis && Object.keys(selectedUpload.aiAnalysis).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Previous Analyses</h4>
                    {Object.entries(selectedUpload.aiAnalysis).map(([type, data]) => (
                      <Card key={type}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm capitalize">{type}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                            {typeof data === 'object' && data !== null && 'result' in data
                              ? String((data as { result: string }).result)
                              : JSON.stringify(data, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUpload && handleDelete(selectedUpload.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
