'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Heart,
  Star,
  Sparkles,
  Trash2,
  ExternalLink,
  Clock,
  Zap,
  Grid,
  List,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FavoriteTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  creditCost: number;
  totalUsage: number;
  addedAt: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'usage'>('recent');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/favorites');
      const data = await res.json();
      if (data.success) {
        setFavorites(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      // Demo data
      setFavorites([
        {
          id: '1',
          name: 'AI Writer',
          slug: 'ai-writer',
          description: 'Generate high-quality content, articles, and creative writing with advanced AI.',
          icon: '✍️',
          category: 'WRITING',
          creditCost: 2,
          totalUsage: 1250,
          addedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Code Generator',
          slug: 'code-generator',
          description: 'Generate clean, efficient code in multiple programming languages.',
          icon: '💻',
          category: 'DEVELOPMENT',
          creditCost: 3,
          totalUsage: 890,
          addedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          name: 'Image Creator',
          slug: 'image-creator',
          description: 'Create stunning AI-generated images from text descriptions.',
          icon: '🎨',
          category: 'DESIGN',
          creditCost: 5,
          totalUsage: 650,
          addedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (toolId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== toolId));
    try {
      await fetch(`/api/user/favorites/${toolId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const filteredFavorites = favorites
    .filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.totalUsage - a.totalUsage;
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              Favorites
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Your saved AI tools for quick access
            </p>
          </div>
          <Link href="/tools">
            <Button className="bg-violet-500 hover:bg-violet-600">
              <Sparkles className="w-5 h-5 mr-2" />
              Browse All Tools
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm border-0 focus:ring-2 focus:ring-violet-500"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name (A-Z)</option>
              <option value="usage">Most Used</option>
            </select>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Favorites Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No matching favorites' : 'No favorites yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Start adding your favorite AI tools for quick access'}
            </p>
            <Link href="/tools">
              <Button>Browse Tools</Button>
            </Link>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredFavorites.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-2xl">
                        {tool.icon}
                      </div>
                      <button
                        onClick={() => removeFavorite(tool.id)}
                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
                        {tool.category}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Zap className="w-4 h-4" />
                        {tool.creditCost} credits
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Added {formatDate(tool.addedAt)}
                    </span>
                    <Link href={`/tools/${tool.slug}`}>
                      <Button size="sm" variant="ghost" className="gap-1">
                        Open <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {filteredFavorites.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-xl">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{tool.description}</p>
                  </div>
                  <span className="hidden md:block px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg text-sm">
                    {tool.category}
                  </span>
                  <span className="hidden sm:flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                    <Zap className="w-4 h-4" />
                    {tool.creditCost}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={`/tools/${tool.slug}`}>
                      <Button size="sm">Open</Button>
                    </Link>
                    <button
                      onClick={() => removeFavorite(tool.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
