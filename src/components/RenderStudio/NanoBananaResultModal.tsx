import React from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { motion } from 'motion/react';

interface NanoBananaResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  imageUrl: string | null;
}

export const NanoBananaResultModal: React.FC<NanoBananaResultModalProps> = ({ isOpen, onClose, onRegenerate, imageUrl }) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'furniture-catalog.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-white font-light tracking-tight text-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            AI 场景可视化
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
            <X size={20} />
          </Button>
        </DialogHeader>
        
        <div className="p-6">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            {imageUrl ? (
              <motion.img
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                src={imageUrl}
                alt="AI 生成的家具场景"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <RefreshCw className="animate-spin mr-2" size={20} />
                正在处理图像...
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 max-w-md">
              使用 <span className="text-indigo-400 font-mono">Nano Banana 1</span> 生成。
              AI 已将您的参数化设计放入真实环境中，同时保持其结构完整性。
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  onClose();
                  onRegenerate();
                }} 
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-6 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                重新生成
              </Button>
              <Button onClick={handleDownload} className="bg-white text-slate-950 hover:bg-slate-200 rounded-full px-6 flex items-center gap-2">
                <Download size={16} />
                下载产品手册
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
