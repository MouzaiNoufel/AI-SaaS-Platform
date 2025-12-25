'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  Send, 
  Copy, 
  Check, 
  Sparkles,
  Clock,
  Zap,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  inputSchema: Record<string, unknown>;
  outputFormat: string;
  isActive: boolean;
  isPremium: boolean;
}

interface AIResponse {
  id: string;
  status: string;
  output?: Record<string, unknown>;
  error?: string;
  processingTime?: number;
  tokenUsage?: { total?: number; prompt?: number; completion?: number } | number;
}

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 
  'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Dutch'
];

const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'
];

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [prompt, setPrompt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript');
  const [response, setResponse] = useState<AIResponse | null>(null);

  const fetchTool = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/${params.slug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Tool not found');
      }

      setTool(data.data);
    } catch (error) {
      console.error('Failed to fetch tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tool details',
        variant: 'destructive',
      });
      router.push('/dashboard/tools');
    } finally {
      setIsLoading(false);
    }
  }, [params.slug, router, toast]);

  useEffect(() => {
    fetchTool();
  }, [fetchTool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast({
        title: 'Input required',
        description: 'Please enter some text to process',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setResponse(null);

    try {
      // Build input object based on tool type
      let input: Record<string, unknown> = { prompt };
      
      // Add tool-specific parameters to input based on actual tool slugs
      if (tool?.slug === 'universal-translator') {
        input = { text: prompt, targetLang: targetLanguage };
      } else if (tool?.slug === 'code-assistant') {
        input = { instruction: prompt, language: programmingLanguage, task: 'write' };
      } else if (tool?.slug === 'text-generator') {
        input = { prompt, tone: 'professional', length: 'medium' };
      } else if (tool?.slug === 'smart-summarizer') {
        input = { text: prompt, length: 'standard' };
      } else if (tool?.slug === 'ai-chatbot') {
        input = { message: prompt };
      } else if (tool?.slug === 'data-analyzer') {
        input = { data: prompt, analysisType: 'summary' };
      } else if (tool?.slug === 'content-rewriter') {
        input = { text: prompt, style: 'professional' };
      } else if (tool?.slug === 'seo-optimizer') {
        input = { content: prompt };
      } else {
        // Default fallback - send as prompt or message
        input = { prompt, message: prompt, text: prompt };
      }

      const requestBody = {
        toolId: tool!.id,
        input,
      };

      const res = await fetch('/api/ai/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResponse(data.data);

      if (data.data.status === 'COMPLETED') {
        toast({
          title: 'Success!',
          description: 'Your request has been processed',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    const text = typeof response?.output === 'object' 
      ? JSON.stringify(response.output, null, 2)
      : String(response?.output || '');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Response copied to clipboard',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tool) {
    return null;
  }

  const getOutputContent = (): string => {
    if (!response?.output) return '';
    
    const output = response.output as Record<string, unknown>;
    
    // Handle different output structures
    if (typeof output === 'string') return output;
    if (output.text) return String(output.text);
    if (output.translation) return String(output.translation);
    if (output.code) return String(output.code);
    if (output.summary) return String(output.summary);
    if (output.response) return String(output.response);
    if (output.message) return String(output.message);
    if (output.result) return typeof output.result === 'string' ? output.result : JSON.stringify(output.result, null, 2);
    if (output.insights) return JSON.stringify(output.insights, null, 2);
    
    return JSON.stringify(output, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tools">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{tool.name}</h1>
            {tool.isPremium && <Badge variant="warning">Premium</Badge>}
          </div>
          <p className="text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input
            </CardTitle>
            <CardDescription>
              Enter your text and configure options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tool-specific inputs */}
              {tool.slug === 'translation' && (
                <div className="space-y-2">
                  <Label>Target Language</Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tool.slug === 'code-assistant' && (
                <div className="space-y-2">
                  <Label>Programming Language</Label>
                  <Select value={programmingLanguage} onValueChange={setProgrammingLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMMING_LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {tool.slug === 'code-assistant' 
                    ? 'Describe what you want to build' 
                    : tool.slug === 'summarization'
                    ? 'Text to summarize'
                    : tool.slug === 'translation'
                    ? 'Text to translate'
                    : 'Your prompt'}
                </Label>
                <Textarea
                  placeholder={
                    tool.slug === 'code-assistant'
                      ? 'E.g., Create a function that sorts an array of objects by a specific property...'
                      : tool.slug === 'summarization'
                      ? 'Paste the text you want to summarize...'
                      : 'Enter your text here...'
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={8}
                  disabled={isProcessing}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isProcessing || !prompt.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Output
                </CardTitle>
                <CardDescription>AI-generated response</CardDescription>
              </div>
              {response?.output && (
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Processing your request...
                </p>
              </div>
            ) : response?.status === 'FAILED' ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Sparkles className="h-6 w-6 text-destructive" />
                </div>
                <p className="mt-4 font-medium text-destructive">Request Failed</p>
                <p className="text-sm text-muted-foreground">
                  {response.error || 'An error occurred while processing your request'}
                </p>
              </div>
            ) : response?.output ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <pre className="whitespace-pre-wrap text-sm">{getOutputContent()}</pre>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {response.processingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(response.processingTime / 1000).toFixed(2)}s
                    </span>
                  )}
                  {response.tokenUsage && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {typeof response.tokenUsage === 'object' 
                        ? (response.tokenUsage as { total?: number }).total || 0
                        : response.tokenUsage} tokens
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-muted p-3">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">No output yet</p>
                <p className="text-sm text-muted-foreground">
                  Enter your prompt and click Generate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
