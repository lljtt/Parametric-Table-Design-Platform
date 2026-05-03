/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Star, MessageCircle, Ruler, Palette, ChevronLeft, ChevronRight, Copy, Download, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTableStore, TableParameters } from '@/store/useTableStore';
import { cn } from '@/lib/utils';
import { generateXHSCopy, XHSCopy } from '@/services/aiService';

interface GalleryDetailModalProps {
  item: {
    id: string;
    imageUrl?: string;
    images?: string[];
    title: string;
    author: string;
    likes: number;
    tags: string[];
    content: string;
    parameters: Partial<TableParameters>;
    isLiked?: boolean;
  };
  mode?: 'public' | 'portfolio';
  onClose: () => void;
  onToggleLike: (id: string) => void;
}

export function GalleryDetailModal({ item, mode = 'public', onClose, onToggleLike }: GalleryDetailModalProps) {
  const { setParameters, setViewMode } = useTableStore();
  const [isLiked, setIsLiked] = React.useState(item.isLiked);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [xhsData, setXhsData] = React.useState<XHSCopy>({
    title: item.title,
    content: item.content,
    tags: item.tags
  });
  
  const displayImages = item.images || (item.imageUrl ? [item.imageUrl] : []);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  const handleCopyCopy = () => {
    const text = `${xhsData.title}\n\n${xhsData.content}\n\n${xhsData.tags.map(t => `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveCover = () => {
    const link = document.createElement('a');
    link.href = displayImages[activeImageIndex];
    link.download = `design-cover-${item.id}-${activeImageIndex}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const data = await generateXHSCopy(item.parameters as TableParameters);
      setXhsData(data);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefSize = () => {
    const sizeParams: Partial<TableParameters> = {
      tableLength: item.parameters.tableLength,
      tableWidth: item.parameters.tableWidth,
      cornerRadius: item.parameters.cornerRadius,
      legHeight: item.parameters.legHeight,
      legWidth: item.parameters.legWidth,
    };
    setParameters(sizeParams);
    setViewMode('editor');
    onClose();
  };

  const handleRefMaterial = () => {
    const materialParams: Partial<TableParameters> = {
      materialCategory: item.parameters.materialCategory,
      colorHue: item.parameters.colorHue,
      metalness: item.parameters.metalness,
      roughness: item.parameters.roughness,
    };
    setParameters(materialParams);
    setViewMode('editor');
    onClose();
  };

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

  React.useEffect(() => {
    if (mode === 'portfolio') {
      handleRegenerate();
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[2rem] w-full max-w-5xl h-full max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Moved slightly to prevent interference with header buttons */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[110] w-10 h-10 bg-black/10 hover:bg-black/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left: Image Sidebar */}
        <div className="flex-[1.2] bg-slate-100 relative overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.img 
              key={activeImageIndex}
              src={displayImages[activeImageIndex]} 
              alt={xhsData.title} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          
          {displayImages.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 active:scale-95 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 active:scale-95 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayImages.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300", 
                  i === activeImageIndex ? 'bg-white' : 'bg-white/40'
                )} 
              />
            ))}
          </div>

          <div className="absolute top-6 left-6">
            <div className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg overflow-hidden">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              RED 实时渲染
            </div>
          </div>
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 flex flex-col h-full bg-white relative">
          {/* Author Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center shrink-0">
            {mode === 'portfolio' ? (
              <div className="flex items-center justify-between w-full pr-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50/50 border border-red-100 flex items-center justify-center">
                    <Sparkles size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">小红书灵感助手</h4>
                    <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">AI 正在为您生成高审美种草文案</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="rounded-full text-[10px] h-7 px-3 font-bold text-slate-500 hover:bg-slate-50 gap-1.5 border-slate-100 ml-2"
                >
                  {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                  重新生成
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                  <img src={`https://i.pravatar.cc/150?u=${item.author}`} alt="author" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">@{item.author}</h4>
                  <p className="text-[10px] text-slate-400 font-medium font-geist uppercase tracking-widest">参数化设计大师</p>
                </div>
              </div>
            )}
          </div>

          {/* Scrolling Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isGenerating ? 'generating' : 'content'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {isGenerating ? (
                    <div className="space-y-8 animate-pulse pt-4">
                      <div className="h-8 bg-slate-100 rounded-lg w-3/4" />
                      <div className="space-y-4">
                        <div className="h-4 bg-slate-50 rounded w-full" />
                        <div className="h-4 bg-slate-50 rounded w-5/6" />
                        <div className="h-4 bg-slate-50 rounded w-4/6" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-red-50 rounded-full w-16" />
                        <div className="h-6 bg-red-50 rounded-full w-20" />
                        <div className="h-6 bg-red-50 rounded-full w-14" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Post Title</span>
                        <p className="text-xl font-bold text-slate-800 leading-tight flex items-center gap-2">
                          {xhsData.title} 
                          <span className="text-red-500">✨</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Caption Content</span>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {xhsData.content}
                          <div className="mt-4 flex flex-wrap gap-2 text-red-500 font-bold">
                            {xhsData.tags.map((tag, i) => (
                              <span key={i}>#{tag.replace(/^#/, '')}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Simulated Social Metrics */}
              <div className="flex items-center gap-6 text-slate-400 border-t border-slate-50 pt-6">
                <div 
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => {
                    setIsLiked(!isLiked);
                    onToggleLike(item.id);
                  }}
                >
                  <Heart size={18} className={cn("transition-all", isLiked && "text-red-500 fill-red-500")} />
                  <span className="text-xs font-bold">点赞</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <Star size={18} className="group-hover:text-yellow-400" />
                  <span className="text-xs font-bold">收藏</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <MessageCircle size={18} className="group-hover:text-primary" />
                  <span className="text-xs font-bold">评论</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="px-8 py-6 border-t border-slate-100 shrink-0 bg-white">
            {mode === 'portfolio' ? (
              <div className="flex gap-4">
                <Button 
                  onClick={handleCopyCopy}
                  disabled={isGenerating}
                  className="flex-1 rounded-2xl h-14 bg-slate-900 hover:bg-black text-white border-none flex items-center justify-center gap-3 font-bold transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Copy size={18} />
                  {isCopied ? "已复制到剪贴板" : "一键复制全篇文案"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSaveCover}
                  disabled={isGenerating}
                  className="rounded-2xl h-14 px-8 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Download size={18} />
                  保存封面
                </Button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Button 
                  onClick={handleRefSize}
                  className="flex-1 rounded-2xl h-14 bg-slate-50 hover:bg-slate-100 text-slate-800 border-none flex items-center justify-center gap-3 font-bold transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className="w-9 h-9 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                    <Ruler size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs">参考尺寸规格</p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Sync Geometry</p>
                  </div>
                </Button>
                <Button 
                  onClick={handleRefMaterial}
                  className="flex-1 rounded-2xl h-14 bg-slate-50 hover:bg-slate-100 text-slate-800 border-none flex items-center justify-center gap-3 font-bold transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className="w-9 h-9 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                    <Palette size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs">参考颜色材质</p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Sync Material</p>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
