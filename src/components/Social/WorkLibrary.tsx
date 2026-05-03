/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, FolderHeart, Clock, Box } from 'lucide-react';
import { useTableStore } from '@/store/useTableStore';
import { Button } from '@/components/ui/button';
import { GalleryDetailModal } from './GalleryDetailModal';

export function WorkLibrary() {
  const { myWorks, setViewMode, setParameters } = useTableStore();
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);

  const handleRemix = (parameters: any) => {
    setParameters(parameters);
    setViewMode('editor');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background atmosphere border-none overflow-y-auto custom-scrollbar">
      <header className="sticky top-0 z-10 glass px-6 h-20 flex items-center justify-between border-b border-white/20 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode('showcase')}
            className="rounded-full hover:bg-white/40"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              我的作品库
              <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-bold uppercase tracking-wider">
                My Portfolio
              </div>
            </h1>
            <p className="text-xs text-slate-500 font-medium">记录你的每一次创意设计与参数灵感</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-white/50 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <FolderHeart size={14} className="text-primary" />
            共 {myWorks.length} 件作品
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-32">
        {myWorks.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/50 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-white/40">
              <Sparkles size={32} className="text-primary/40" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">作品库空空如也</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-8">
              你还没有保存过设计？快去点击“保存至作品库”留下你的第一个灵感吧！
            </p>
            <Button 
              onClick={() => setViewMode('editor')}
              className="rounded-full shadow-lg font-bold px-8"
            >
              去设计我的桌子
            </Button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {myWorks.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid"
                onClick={() => setSelectedItem(item)}
              >
                <div className="group relative glass rounded-[2.5rem] overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-white/40">
                  <div className="relative overflow-hidden bg-slate-100 aspect-square">
                    <img 
                      src={item.images[0]} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                    />
                    
                    <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20 pointer-events-none">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-600">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                       <Button size="sm" variant="secondary" className="rounded-full font-bold self-start">
                          <Box size={14} className="mr-2" />
                          查看参数
                       </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-2 line-clamp-1">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div 
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70]"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => setViewMode('editor')}
            className="rounded-full shadow-2xl h-16 px-10 group font-bold bg-primary hover:scale-105 transition-all text-white border-4 border-white/20"
          >
            <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
            开始新设计
          </Button>
        </motion.div>

        <AnimatePresence>
          {selectedItem && (
            <GalleryDetailModal 
              mode="portfolio"
              item={{
                ...selectedItem,
                author: '我',
                likes: 0,
                tags: ['家居美学', '参数化设计', '我的私藏好物', '极简生活', '装修灵感'],
                content: selectedItem.description
              }} 
              onClose={() => setSelectedItem(null)}
              onToggleLike={() => {}}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
