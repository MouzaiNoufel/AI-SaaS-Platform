'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Wrench, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolCardSkeleton } from '@/components/ui/skeleton';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  isPremium: boolean;
}

const categoryColors: Record<string, string> = {
  TEXT: 'bg-blue-500',
  CODE: 'bg-green-500',
  ANALYSIS: 'bg-purple-500',
  TRANSLATION: 'bg-yellow-500',
  CHAT: 'bg-pink-500',
  OTHER: 'bg-gray-500',
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const res = await fetch('/api/tools');
        const data = await res.json();
        setTools(data.data || []);
        setFilteredTools(data.data || []);
      } catch (error) {
        console.error('Failed to fetch tools:', error);
      } finally {
        setIsLoading(false);
      }
    };

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

  const categories = ['all', ...new Set(tools.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Tools</h1>
        <p className="text-muted-foreground">
          Explore our collection of powerful AI tools
        </p>
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
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tools Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTools.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <Card key={tool.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
              {tool.isPremium && (
                <div className="absolute right-4 top-4">
                  <Badge variant="warning">Premium</Badge>
                </div>
              )}
              <CardHeader>
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${
                    categoryColors[tool.category] || 'bg-primary'
                  }`}
                >
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="mt-4">{tool.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{tool.category}</Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/tools/${tool.slug}`}>
                      Use Tool
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wrench className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No tools found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
