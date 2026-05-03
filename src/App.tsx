/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scene } from './components/ThreeViewer/Scene';
import { ParameterSliders } from './components/ControlPanel/ParameterSliders';
import { ChatBot } from './components/ChatBot/ChatBot';
import { CaptureButton } from './components/RenderStudio/CaptureButton';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { Box, Sparkles, Settings2, MessageSquare, FolderHeart } from 'lucide-react';

import { useTableStore } from './store/useTableStore';
import { ShowcasePage } from './pages/ShowcasePage';
import { InspirationGallery } from './components/Social/InspirationGallery';
import { WorkLibrary } from './components/Social/WorkLibrary';

export default function App() {
  const { viewMode, setViewMode } = useTableStore();

  if (viewMode === 'showcase') {
    return <ShowcasePage />;
  }

  if (viewMode === 'gallery') {
    return <InspirationGallery />;
  }

  if (viewMode === 'library') {
    return <WorkLibrary />;
  }

  return (
    <div className="h-screen atmosphere flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="h-16 glass z-50 px-6 flex items-center justify-between sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white">
            <Box size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800">参数化 AI 设计</h1>
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest leading-none">家具设计工作室</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewMode('gallery')}
            className="rounded-full text-[10px] font-bold uppercase tracking-widest gap-2 hover:bg-white/40"
          >
            <Sparkles size={12} className="text-primary" />
            探索灵感
          </Button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">由 Gemini AI 驱动</span>
          </div>
          <CaptureButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
        {/* Left Side: 3D Viewer & AI Chat */}
        <div className="flex-[1.5] flex flex-col gap-4 overflow-hidden min-h-0">
          <div className="flex-1 relative min-h-0 rounded-[2rem] overflow-hidden glass border border-white/40 shadow-none">
            <Scene />
            {/* Minimal label overlay */}
            <div className="absolute top-4 left-4 pointer-events-none z-20">
              <div className="bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                <Box size={14} className="text-primary" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">3D 实时编辑器</span>
              </div>
            </div>
          </div>
          
          {/* AI Designer Chat at bottom left */}
          <div className="h-64 glass rounded-[2rem] overflow-hidden flex flex-col shrink-0">
            <div className="px-5 py-3 border-b border-white/20 flex items-center gap-2 shrink-0">
              <MessageSquare size={13} className="text-primary" />
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">AI 设计助手</span>
            </div>
            <div className="flex-1 min-h-0">
              <ChatBot />
            </div>
          </div>
        </div>

        {/* Right Side: Parameter Controls ONLY */}
        <div className="w-80 md:w-96 glass rounded-[2rem] flex flex-col overflow-hidden shrink-0">
          <div className="px-6 pt-6 pb-2 flex items-center gap-2 shrink-0">
            <Settings2 size={15} className="text-primary" />
            <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">参数精细化控制</h2>
          </div>
          <div className="flex-1 min-h-0 px-6 pb-6 overflow-hidden">
            <ParameterSliders />
          </div>
        </div>
      </main>
    </div>
  );
}

