'use client';

import { useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
  _count?: {
    requests: number;
  };
}

const categories = ['TEXT', 'CODE', 'ANALYSIS', 'TRANSLATION', 'CHAT', 'OTHER'];

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'TEXT',
    icon: 'wrench',
    isActive: true,
    isPremium: false,
  });
  const { toast } = useToast();

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/tools');
      const data = await res.json();
      setTools(data.data || []);
      setFilteredTools(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tools',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    let result = tools;

    if (searchQuery) {
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((tool) => tool.category === categoryFilter);
    }

    setFilteredTools(result);
  }, [searchQuery, categoryFilter, tools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTool
        ? `/api/admin/tools/${editingTool.id}`
        : '/api/admin/tools';
      const method = editingTool ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save tool');
      }

      const savedTool = await res.json();

      if (editingTool) {
        setTools((prev) => prev.map((t) => (t.id === editingTool.id ? savedTool.data : t)));
      } else {
        setTools((prev) => [...prev, savedTool.data]);
      }

      toast({
        title: editingTool ? 'Tool updated' : 'Tool created',
        description: `${formData.name} has been ${editingTool ? 'updated' : 'created'}`,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save tool',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (tool: Tool) => {
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete tool');

      setTools((prev) => prev.filter((t) => t.id !== tool.id));
      toast({
        title: 'Tool deleted',
        description: `${tool.name} has been deleted`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tool',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (tool: Tool) => {
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tool.isActive }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to update tool');

      const updated = await res.json();
      setTools((prev) => prev.map((t) => (t.id === tool.id ? updated.data : t)));

      toast({
        title: 'Tool updated',
        description: `${tool.name} has been ${updated.data.isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tool',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      category: tool.category,
      icon: tool.icon,
      isActive: tool.isActive,
      isPremium: tool.isPremium,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'TEXT',
      icon: 'wrench',
      isActive: true,
      isPremium: false,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tool Management</h1>
          <p className="text-muted-foreground">{tools.length} total tools</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTools} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTool ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
                <DialogDescription>
                  {editingTool ? 'Update the tool details' : 'Create a new AI tool'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isPremium}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                    />
                    <Label>Premium</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingTool ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tools Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : filteredTools.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tool</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Usage</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTools.map((tool) => (
                    <tr key={tool.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {tool.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{tool.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={tool.isActive ? 'success' : 'secondary'}>
                            {tool.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {tool.isPremium && <Badge variant="warning">Premium</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tool._count?.requests || 0} requests
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(tool)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(tool)}>
                              <Power className="mr-2 h-4 w-4" />
                              {tool.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(tool)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wrench className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No tools found</h3>
            <p className="text-muted-foreground">Create your first AI tool to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
