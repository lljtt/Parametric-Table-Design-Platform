/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ArrowLeft, Users, Sparkles, FolderHeart } from 'lucide-react';
import { useTableStore, TableParameters } from '@/store/useTableStore';
import { Button } from '@/components/ui/button';
import { GalleryDetailModal } from './GalleryDetailModal';

interface InspirationItem {
  id: string;
  imageUrl: string;
  title: string;
  author: string;
  likes: number;
  tags: string[];
  height: number;
  isLiked?: boolean;
  content: string;
  parameters: Partial<TableParameters>;
}

const INITIAL_GALLERY: InspirationItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?q=80&w=1000&auto=format&fit=crop',
    title: '极简北欧风书桌',
    author: '家具探索者',
    likes: 1240,
    tags: ['木质', '北欧', '简约'],
    height: 400,
    content: '清晨的第一缕阳光透过纱窗，刚好洒在这张极简北欧风的书桌上。1800mm x 800mm 的超长尺寸，给了我足够任性的自由度。原木的质感在光影下泛着细腻而克制的微光，仿佛每一个木纹都在诉说森林的故事。',
    parameters: {
      tableLength: 1800,
      tableWidth: 800,
      materialCategory: 'wood',
      cornerRadius: 10,
      colorHue: 35
    }
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?q=80&w=1000&auto=format&fit=crop',
    title: '工业风办公长桌',
    author: '设计狮艾力',
    likes: 850,
    tags: ['工业', '金属', '办公'],
    height: 300,
    content: '冷峻的线条，深邃的金属质感，这是我为工作室打造的梦想工台。工业风的粗犷与现代审美的碰撞，2000mm 的超长桌面足以承载我所有的灵感瞬间。',
    parameters: {
      tableLength: 2000,
      tableWidth: 900,
      materialCategory: 'anodized',
      metalness: 0.9,
      roughness: 0.1,
      colorHue: 210
    }
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1000&auto=format&fit=crop',
    title: '日式侘寂餐桌',
    author: '禅意生活',
    likes: 2100,
    tags: ['日式', '侘寂', '橡木'],
    height: 500,
    content: '极简，从来不是空无一物，而是褪去繁杂后留下的最纯粹质感。这张侘寂风餐桌，不仅是进食之所，更是我深夜独处时，那座最坚固、最温柔的精神岛屿。',
    parameters: {
      tableLength: 1600,
      tableWidth: 1600,
      cornerRadius: 800, // Round
      materialCategory: 'wood',
      colorHue: 40
    }
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop',
    title: '现代岩板纹圆桌',
    author: '美学至上',
    likes: 1560,
    tags: ['岩板', '轻奢', '客厅'],
    height: 350,
    content: '把自然肌理搬进客厅。精致的岩板工艺，搭配极简金属底座，让每一次下午茶都成为了充满仪式感的行为艺术。',
    parameters: {
      tableLength: 1200,
      tableWidth: 1200,
      cornerRadius: 600,
      materialCategory: 'slate',
      metalness: 0.5,
      colorHue: 0
    }
  }
];
export function InspirationGallery() {
  const { setViewMode } = useTableStore();
  const [galleryItems, setGalleryItems] = React.useState<InspirationItem[]>(INITIAL_GALLERY);
  const [selectedItem, setSelectedItem] = React.useState<InspirationItem | null>(null);

  const toggleLike = (e: React.MouseEvent | string, id?: string) => {
    // If e is a string, it's called from Modal, if it's an event, it's from Card
    const targetId = typeof e === 'string' ? e : id;
    if (typeof e !== 'string') e.stopPropagation();
    
    setGalleryItems(prev => prev.map(item => {
      if (item.id === targetId) {
        const isNowLiked = !item.isLiked;
        return {
          ...item,
          isLiked: isNowLiked,
          likes: isNowLiked ? item.likes + 1 : item.likes - 1
        };
      }
      return item;
    }));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background atmosphere border-none overflow-y-auto custom-scrollbar">
      <header className="sticky top-0 z-10 glass px-6 h-20 flex items-center justify-between border-b border-white/20 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode('editor')}
            className="rounded-full hover:bg-white/40"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              灵感画廊
              <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-bold uppercase tracking-wider">
                Inspiration
              </div>
            </h1>
            <p className="text-xs text-slate-500 font-medium">看全球用户如何搭配他们的 3D 家具设计</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <div className="hidden sm:flex items-center -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="avatar" />
              </div>
            ))}
            <div className="pl-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 font-geist">
              <Users size={12} />
              12,408 人在线
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-32">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="break-inside-avoid"
              onClick={() => setSelectedItem(item)}
            >
              <div className="group relative glass rounded-[2.5rem] overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-white/40">
                <div 
                  className="relative overflow-hidden bg-slate-100"
                  style={{ height: item.height }}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                    <div className="flex gap-2 mb-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                          # {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20 pointer-events-none">
                    <Heart 
                      size={14} 
                      className={item.isLiked ? "text-red-500 fill-red-500" : "text-red-500 fill-red-500 opacity-60"} 
                    />
                    <span className="text-[10px] font-bold text-slate-800">{item.likes > 1000 ? `${(item.likes/1000).toFixed(1)}k` : item.likes}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-white/40 shadow-sm">
                        <img src={`https://i.pravatar.cc/100?u=${item.author}`} alt="author" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 line-clamp-1 uppercase tracking-tight">@{item.author}</span>
                    </div>
                    
                    <motion.button 
                      whileTap={{ scale: 1.5 }}
                      onClick={(e) => toggleLike(e, item.id)}
                      className={`transition-colors duration-300 ${item.isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
                    >
                      <Heart 
                        size={20} 
                        className={item.isLiked ? "fill-current" : ""} 
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70]"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => setViewMode('editor')}
            className="rounded-full shadow-2xl h-16 px-10 group font-bold bg-primary hover:scale-105 transition-all text-white border-4 border-white/20"
          >
            <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
            我也要设计我的家具
          </Button>
        </motion.div>

        <AnimatePresence>
          {selectedItem && (
            <GalleryDetailModal 
              item={selectedItem} 
              onClose={() => setSelectedItem(null)}
              onToggleLike={(id) => toggleLike(id)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
