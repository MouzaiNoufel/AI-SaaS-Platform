'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  FileText,
  MessageSquare,
  Settings,
  User,
  History,
  Star,
  Sparkles,
  Image,
  Code,
  Music,
  Video,
  PenTool,
  Languages,
  BarChart,
  X,
  ArrowRight,
  Keyboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'tool' | 'page' | 'history' | 'action';
  title: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

const allResults: SearchResult[] = [
  // AI Tools
  {
    id: 'ai-writer',
    type: 'tool',
    title: 'AI Writer',
    description: 'Generate articles, blogs, and creative content',
    icon: <PenTool className="w-5 h-5 text-pink-500" />,
    href: '/dashboard/tools/ai-writer',
    keywords: ['write', 'article', 'blog', 'content', 'text'],
  },
  {
    id: 'code-generator',
    type: 'tool',
    title: 'Code Generator',
    description: 'Generate code in any programming language',
    icon: <Code className="w-5 h-5 text-emerald-500" />,
    href: '/dashboard/tools/code-generator',
    keywords: ['code', 'programming', 'developer', 'script'],
  },
  {
    id: 'image-generator',
    type: 'tool',
    title: 'Image Generator',
    description: 'Create stunning images with AI',
    icon: <Image className="w-5 h-5 text-purple-500" />,
    href: '/dashboard/tools/image-generator',
    keywords: ['image', 'picture', 'photo', 'art', 'visual'],
  },
  {
    id: 'chat-assistant',
    type: 'tool',
    title: 'Chat Assistant',
    description: 'Have intelligent conversations',
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    href: '/dashboard/chat',
    keywords: ['chat', 'assistant', 'conversation', 'help'],
  },
  {
    id: 'translator',
    type: 'tool',
    title: 'Translator',
    description: 'Translate text between languages',
    icon: <Languages className="w-5 h-5 text-amber-500" />,
    href: '/dashboard/tools/translator',
    keywords: ['translate', 'language', 'convert'],
  },
  {
    id: 'audio-generator',
    type: 'tool',
    title: 'Audio Generator',
    description: 'Create music and audio content',
    icon: <Music className="w-5 h-5 text-rose-500" />,
    href: '/dashboard/tools/audio-generator',
    keywords: ['audio', 'music', 'sound', 'voice'],
  },
  {
    id: 'video-generator',
    type: 'tool',
    title: 'Video Generator',
    description: 'Generate videos with AI',
    icon: <Video className="w-5 h-5 text-red-500" />,
    href: '/dashboard/tools/video-generator',
    keywords: ['video', 'movie', 'clip', 'animation'],
  },
  {
    id: 'summarizer',
    type: 'tool',
    title: 'Summarizer',
    description: 'Summarize long texts and documents',
    icon: <FileText className="w-5 h-5 text-cyan-500" />,
    href: '/dashboard/tools/summarizer',
    keywords: ['summary', 'summarize', 'short', 'brief'],
  },
  // Pages
  {
    id: 'dashboard',
    type: 'page',
    title: 'Dashboard',
    description: 'View your dashboard',
    icon: <BarChart className="w-5 h-5 text-violet-500" />,
    href: '/dashboard',
    keywords: ['home', 'main', 'overview'],
  },
  {
    id: 'favorites',
    type: 'page',
    title: 'Favorites',
    description: 'View your saved tools',
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    href: '/dashboard/favorites',
    keywords: ['saved', 'bookmarks', 'starred'],
  },
  {
    id: 'history',
    type: 'page',
    title: 'History',
    description: 'View your activity history',
    icon: <History className="w-5 h-5 text-gray-500" />,
    href: '/dashboard/history',
    keywords: ['past', 'previous', 'activity'],
  },
  {
    id: 'settings',
    type: 'page',
    title: 'Settings',
    description: 'Manage your account settings',
    icon: <Settings className="w-5 h-5 text-gray-500" />,
    href: '/dashboard/settings',
    keywords: ['preferences', 'config', 'account'],
  },
  {
    id: 'profile',
    type: 'page',
    title: 'Profile',
    description: 'View and edit your profile',
    icon: <User className="w-5 h-5 text-gray-500" />,
    href: '/dashboard/profile',
    keywords: ['account', 'me', 'user'],
  },
  {
    id: 'api-keys',
    type: 'page',
    title: 'API Keys',
    description: 'Manage your API keys',
    icon: <Keyboard className="w-5 h-5 text-gray-500" />,
    href: '/dashboard/api-keys',
    keywords: ['api', 'keys', 'developer', 'integration'],
  },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filteredResults = query
    ? allResults.filter((result) => {
        const searchTerms = query.toLowerCase().split(' ');
        return searchTerms.every(
          (term) =>
            result.title.toLowerCase().includes(term) ||
            result.description?.toLowerCase().includes(term) ||
            result.keywords?.some((k) => k.includes(term))
        );
      })
    : allResults;

  const groupedResults = filteredResults.reduce<Record<string, SearchResult[]>>(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {}
  );

  const flatResults = Object.values(groupedResults).flat();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    },
    []
  );

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatResults[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      router.push(result.href);
    }
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const typeLabels: Record<string, string> = {
    tool: 'AI Tools',
    page: 'Pages',
    history: 'Recent',
    action: 'Actions',
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Search tools, pages, or actions..."
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
                  />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {flatResults.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No results found for "{query}"</p>
                    </div>
                  ) : (
                    Object.entries(groupedResults).map(([type, results]) => (
                      <Fragment key={type}>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {typeLabels[type] || type}
                        </div>
                        {results.map((result) => {
                          const index = flatResults.indexOf(result);
                          const isSelected = index === selectedIndex;
                          
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                                isSelected
                                  ? 'bg-violet-500 text-white'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div className={isSelected ? 'text-white' : ''}>
                                {result.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                {result.description && (
                                  <div className={`text-sm truncate ${
                                    isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {result.description}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className={`w-4 h-4 opacity-0 ${isSelected ? 'opacity-100' : ''}`} />
                            </button>
                          );
                        })}
                      </Fragment>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
                      <span className="ml-1">Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                      <span className="ml-1">Select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd>
                      <span className="ml-1">Close</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Powered Search
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook to programmatically open the command palette
export function useCommandPalette() {
  const openPalette = useCallback(() => {
    // Dispatch a keyboard event to trigger the palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  return { openPalette };
}
