import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';
import { FileText, Play, Trash2, ChevronDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { exampleBidRequests } from '@/lib/exampleData';
import { ValidationResults } from '@/components/ValidationResults';
import { BulkAnalysis } from '@/components/BulkAnalysis';
import { FileUpload } from '@/components/FileUpload';

// Helper to extract multiple JSON objects from arbitrary text
const splitJsonObjects = (text: string): string[] => {
    const objects: string[] = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inString) {
            if (escape) {
                escape = false;
            } else if (c === '\\') {
                escape = true;
            } else if (c === '"') {
                inString = false;
            }
        } else {
            if (c === '"') {
                inString = true;
            } else if (c === '{' || c === '[') {
                if (depth === 0) start = i;
                depth++;
            } else if (c === '}' || c === ']') {
                depth--;
                if (depth === 0 && start !== -1) {
                    const obj = text.slice(start, i + 1).trim();
                    if (obj) objects.push(obj);
                    start = -1;
                }
            }
        }
    }
    return objects;
};

const Header = ({ mode, setMode }: { mode: 'single' | 'bulk', setMode: (m: 'single' | 'bulk') => void }) => {
    const navigate = useNavigate();
    
    return (
        <header className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
                <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-white">BABE Verificator</h1>
            </div>
            <div className="flex items-center space-x-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate('/rulebook')}
                                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                                <Info className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Rulebook</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>OpenRTB rulebook</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
                    <Button 
                      variant={mode === 'single' ? 'secondary' : 'ghost'} 
                      className={`px-4 py-1.5 h-auto text-sm ${mode === 'single' ? 'bg-slate-200 text-slate-900 hover:bg-slate-300' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                      onClick={() => setMode('single')}
                    >
                      Single Analysis
                    </Button>
                    <Button 
                      variant={mode === 'bulk' ? 'secondary' : 'ghost'}
                      className={`px-4 py-1.5 h-auto text-sm ${mode === 'bulk' ? 'bg-slate-200 text-slate-900 hover:bg-slate-300' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                      onClick={() => setMode('bulk')}
                    >
                      Bulk Upload
                    </Button>
                </div>
            </div>
        </header>
    );
};

const JsonEditor = ({ jsonText, onTextChange }: { jsonText: string; onTextChange: (text: string) => void }) => (
    <textarea
        value={jsonText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your OpenRTB bid request here..."
        className="w-full h-full p-4 font-mono text-sm bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-300 resize-none border border-slate-700"
        spellCheck="false"
    />
);

const ExamplesDropdown = ({ onLoadExample }: { onLoadExample: (key: keyof typeof exampleBidRequests) => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
                Load Example <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onLoadExample('display')}>Display Banner</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('video')}>Video Ad</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('native')}>Native Ad</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('ctv')}>Connected TV</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('audio')}>Audio Ad</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('gdpr')}>GDPR Example</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('error-privacy')}>Privacy Error</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('malformed-json')}>Malformed JSON</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

export default function IndexPage() {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [isLoading, setIsLoading] = useState(false);
    const [jsonText, setJsonText] = useState(exampleBidRequests['display']);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [fileName, setFileName] = useState('');
    const [bulkRequests, setBulkRequests] = useState<any[]>([]);
    const [multiResults, setMultiResults] = useState<{analysis: AnalysisResult; issues: ValidationIssue[]}[]>([]);
    const [multiTexts, setMultiTexts] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (multiResults.length > 0) {
            const res = multiResults[currentIndex];
            setAnalysisResult(res.analysis);
            setValidationIssues(res.issues);
            if (multiTexts[currentIndex]) {
                setJsonText(multiTexts[currentIndex]);
            }
        }
    }, [currentIndex, multiResults, multiTexts]);

    const runAnalysis = useCallback((text: string) => {
        const { analysis, issues } = analyzer.analyze(text);

        if (analysis && !analysis.error) {
            try {
                const parsedRequest = JSON.parse(text);
                const summary = analysis.summary as any;

                if (!summary.timeoutMs && parsedRequest.tmax) {
                    summary.timeoutMs = parsedRequest.tmax;
                }

                if (!summary.currency && parsedRequest.cur && parsedRequest.cur.length > 0) {
                    summary.currency = parsedRequest.cur[0];
                }

                if (parsedRequest.imp && parsedRequest.imp.length > 0) {
                    const firstImp = parsedRequest.imp[0];
                    if (firstImp.bidfloor && !summary.bidFloor) {
                        const floorCur = firstImp.bidfloorcur || summary.currency || '';
                        summary.bidFloor = `${firstImp.bidfloor}${floorCur ? ` ${floorCur}` : ''}`;
                    }
                    if (!summary.currency && firstImp.bidfloorcur) {
                        summary.currency = firstImp.bidfloorcur;
                    }
                }

                if (parsedRequest.source && parsedRequest.source.schain && Array.isArray(parsedRequest.source.schain.nodes)) {
                    summary.schainNodes = parsedRequest.source.schain.nodes.length;
                }

                const privacySignals: string[] = [];
                if (parsedRequest.regs?.ext?.gdpr === 1) {
                    privacySignals.push('GDPR Applicable');
                }
                if (parsedRequest.user?.ext?.consent) {
                    privacySignals.push('TCF Consent String');
                }
                if (parsedRequest.regs?.ext?.us_privacy) {
                    privacySignals.push('CCPA/US Privacy');
                }
                if (parsedRequest.regs?.gpp) {
                    privacySignals.push('Global Privacy Platform (GPP)');
                }
                summary.privacySignals = privacySignals;
            } catch (e) {
                console.error('Could not parse JSON to enhance summary', e);
            }
        }

        return { analysis, issues };
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (!jsonText.trim()) {
            toast.error('Input is empty.');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            const texts = splitJsonObjects(jsonText.trim());
            const realTexts = texts.length ? texts : [jsonText.trim()];
            const results = realTexts.map(t => runAnalysis(t));

            setMultiResults(results);
            setMultiTexts(realTexts);
            setCurrentIndex(0);

            const first = results[0];
            setAnalysisResult(first.analysis);
            setValidationIssues(first.issues);
            setJsonText(realTexts[0]);
            setIsLoading(false);

            if (results.length > 1) {
                toast.success(`Analyzed ${results.length} requests.`);
            } else if (first.analysis && !first.analysis.error) {
                toast.success('Analysis complete!', { description: `${first.issues.length} issue(s) found.` });
            } else {
                toast.error(first.analysis?.error || 'An unknown analysis error occurred.');
            }
        }, 300);
    }, [jsonText, runAnalysis]);

    const handleLoadExample = useCallback((key: keyof typeof exampleBidRequests) => {
        setJsonText(exampleBidRequests[key]);
        setAnalysisResult(null);
        setValidationIssues([]);
        setMultiResults([]);
        setMultiTexts([]);
        setCurrentIndex(0);
        toast.info(`Loaded "${key}" example.`);
    }, []);

    const handleFormat = useCallback(() => {
        const objects = splitJsonObjects(jsonText.trim());
        if (objects.length > 1) {
            const formatted: string[] = [];
            for (let i = 0; i < objects.length; i++) {
                try {
                    const obj = JSON.parse(objects[i]);
                    formatted.push(JSON.stringify(obj, null, 2));
                } catch {
                    toast.error(`Request ${i + 1} is not valid JSON.`);
                    return;
                }
            }
            setJsonText(formatted.join('\n\n'));
            setMultiTexts(formatted);
            toast.success('JSON formatted successfully.');
        } else {
            try {
                const parsed = JSON.parse(jsonText);
                const formatted = JSON.stringify(parsed, null, 2);
                setJsonText(formatted);
                setMultiTexts([formatted]);
                toast.success('JSON formatted successfully.');
            } catch {
                toast.error('Cannot format invalid JSON.');
            }
        }
    }, [jsonText]);

    const handleFileUpload = useCallback((file: File) => {
        setIsLoading(true);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const requests = splitJsonObjects(text).map(obj => JSON.parse(obj));
                
                setMode('bulk');
                setFileName(file.name);
                setBulkRequests(requests);
                setIsLoading(false);
                
                toast.success(`${requests.length} requests loaded from ${file.name}`);
            } catch (e) {
                setIsLoading(false);
                toast.error('Failed to parse file. Ensure it contains valid JSON objects.');
            }
        };
        
        reader.readAsText(file);
    }, []);

    const handleRequestSelection = useCallback((request: any) => {
        setMode('single');
        const text = JSON.stringify(request, null, 2);
        setJsonText(text);
        setAnalysisResult(null);
        setValidationIssues([]);
        setMultiResults([]);
        setMultiTexts([]);
        setCurrentIndex(0);

        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(text);
            setAnalysisResult(analysis);
            setValidationIssues(issues);
            toast.info("Switched to single analysis for selected request.");
        }, 100);
    }, []);

    const handleClear = useCallback(() => {
        setJsonText('');
        setAnalysisResult(null);
        setValidationIssues([]);
        setMultiResults([]);
        setMultiTexts([]);
        setCurrentIndex(0);
    }, []);

    return (
        <div className="min-h-screen bg-[#0c111d] text-slate-200 font-sans">
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Header mode={mode} setMode={setMode} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" style={{height: 'calc(100vh - 8rem)'}}>
                    <div className="lg:col-span-5 flex flex-col h-full">
                        {mode === 'single' ? (
                            <Card className="bg-slate-900 border-slate-800 flex flex-col flex-grow h-full">
                                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-800 flex-shrink-0">
                                    <CardTitle className="text-base flex items-center font-semibold">
                                        <FileText className="w-4 h-4 mr-2 text-orange-400" />
                                        Bid Request Input
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={handleFormat}>Format</Button>
                                        <ExamplesDropdown onLoadExample={handleLoadExample} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-grow overflow-hidden">
                                    <JsonEditor jsonText={jsonText} onTextChange={setJsonText} />
                                </CardContent>
                                <div className="p-3 border-t border-slate-800 flex items-center space-x-2 flex-shrink-0">
                                    <Button 
                                        onClick={handleAnalyze} 
                                        disabled={isLoading || !jsonText} 
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold py-2 text-sm"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2" />
                                        ) : (
                                            <Play className="w-5 h-5 mr-2" />
                                        )}
                                        {isLoading ? 'Analyzing...' : 'Analyze Request'}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleClear} className="text-slate-400 hover:text-white hover:bg-slate-700">
                                        <Trash2 className="w-5 h-5"/>
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <FileUpload onFileUpload={handleFileUpload} />
                        )}
                    </div>
                    
                    <div className="lg:col-span-7 h-full">
                        {mode === 'single' ? (
                            <div className="h-full flex flex-col space-y-2">
                                {multiResults.length > 1 && (
                                    <Pagination className="self-center">
                                        <PaginationContent>
                                            <PaginationPrevious onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))} />
                                            <PaginationItem className="px-3 flex items-center text-sm">{currentIndex + 1} / {multiResults.length}</PaginationItem>
                                            <PaginationNext onClick={() => setCurrentIndex(i => Math.min(i + 1, multiResults.length - 1))} />
                                        </PaginationContent>
                                    </Pagination>
                                )}
                                <ValidationResults
                                    analysis={analysisResult}
                                    issues={validationIssues}
                                    isLoading={isLoading}
                                />
                            </div>
                        ) : (
                            <BulkAnalysis
                                data={bulkRequests}
                                fileName={fileName}
                                onRequestSelect={handleRequestSelection}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>
            </main>
            <Toaster theme="dark" position="bottom-right" richColors />
        </div>
    );
}
