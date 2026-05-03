import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useTableStore } from '../../store/useTableStore';
import { generateImage } from '../../services/openclawClient';
import {
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const AIHomeCustomizer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'upload' | 'processing' | 'done'>('upload');
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { generatedImages, setGeneratedImages, setCurrentImageIndex, capturedSnapshot } = useTableStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoData = event.target?.result as string;
        setTempPhoto(photoData);
        // Start processing automatically after upload
        handleStartProcessing(photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset step when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep('upload');
    }
  }, [isOpen]);

  // Utility to resize images to prevent API timeout due to large payload
  const resizeImage = (base64Str: string, maxWidth = 768): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      // Set a local timeout for resizing
      setTimeout(() => reject(new Error('图片处理超时')), 10000);
    });
  };

  const handleStartProcessing = async (photoData: string) => {
    // 1. Set UI state immediately
    setIsGenerating(true);
    setStep('processing');

    console.log('Starting AI processing journey...');

    try {
      // 2. Prepare assets
      console.log('Preparing assets for AI...');
      const sourceImage = capturedSnapshot || generatedImages[0];
      const smallTableRender = await resizeImage(sourceImage, 800).catch(() => { throw new Error('读取设计模型图失败'); });
      const smallUserPhoto = await resizeImage(photoData, 1024).catch(() => { throw new Error('读取场景照片失败'); });

      const tableRenderBase64 = smallTableRender.split(',')[1];
      const userPhotoBase64 = smallUserPhoto.split(',')[1];

      console.log('Calling Nano Banana (gemini-3.1-flash-image) for high-fidelity fusion...');

      const fusionPromise = generateImage(
        [
          { data: userPhotoBase64, mimeType: 'image/jpeg' },
          { data: tableRenderBase64, mimeType: 'image/jpeg' }
        ],
        `TASK: HIGH-FIDELITY ARCHITECTURAL FUSION.

        CONTEXT:
        - Image 1: Target room (empty floor).
        - Image 2: The specific user-designed table as provided in the render.

        CRITICAL INSTRUCTIONS:
        1. MODALITY: IMAGE ONLY OUTPUT. DO NOT RETURN ANY TEXT.
        2. PLACEMENT: Automatically detect the central floor area in Image 1.
        3. PERSPECTIVE: Scale and rotate the object from Image 2 to match the room's vanishing point and floor plane of Image 1.
        4. DESIGN INTEGRITY: You MUST faithfully reproduce the exact geometry, colors, and materials shown in Image 2. Do not generalize or change the object's design.
        5. INTEGRATION: Blend the object seamlessly into the room. Add contact shadows and ambient occlusion based on Image 1's light sources.

        EXECUTION: Output the high-resolution composite image.`
      );

      // 3. Execution with timeout racing
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI 响应超时。这可能是由于网络不稳定，请尝试上传一张稍小或更清晰的照片。')), 150000)
      );

      const newImage = await Promise.race([fusionPromise, timeoutPromise]);

      console.log('AI response received');

      if (!newImage) throw new Error('AI 返回内容为空');

      setGeneratedImages([...generatedImages, newImage]);
      setCurrentImageIndex(generatedImages.length);
      setStep('done');
    } catch (error) {
      console.error('AI Integration Error:', error);
      const errorMsg = error instanceof Error ? error.message : '未知融合错误';
      alert(`AI 装修集成失败: ${errorMsg}\n\n建议建议：\n1. 确保上传的照片光线较好且有开阔地面。\n2. 重试一次。`);
      setStep('upload');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-none w-[95vw] sm:max-w-[1000px] sm:w-[90vw] glass border-white/40 p-0 overflow-hidden shadow-2xl"
        showCloseButton={false}
      >
        <div className="flex flex-col md:flex-row h-auto md:h-[min(650px,85vh)] overflow-y-auto md:overflow-hidden relative bg-white/20 backdrop-blur-xl">
          {/* Mobile Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-md transition-all md:hidden"
          >
            <X size={20} className="text-slate-700" />
          </button>

          {/* Left Side: Guide */}
          <div className="w-full md:w-[320px] bg-slate-50/80 border-b md:border-b-0 md:border-r border-white/20 p-6 md:p-10 flex flex-col gap-8 shrink-0">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/10">
                <Sparkles size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">一键 AI 装修</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed opacity-90">
                  利用 Nano Banana (Gemini 3.1 Flash Image) 模型，自动寻找家中最佳点位并精准融合您的设计。
                </p>
              </div>
            </div>

            <div className="mt-2 md:mt-auto space-y-6 md:space-y-8">
              {[
                { step: 1, title: '环境拍摄', desc: '上传一张家中空地的照片' },
                { step: 2, title: '智能分析', desc: 'AI 自动解析照片透视与摆放位置' },
                { step: 3, title: '视觉融合', desc: '全自动生成真实的家居展示图' }
              ].map((item) => (
                <div key={item.step} className="group flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[11px] font-bold text-slate-400 border border-slate-200 shrink-0 shadow-sm group-hover:border-primary group-hover:text-primary transition-all">
                    {item.step}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs md:text-sm text-slate-700 font-bold">{item.title}</p>
                    <p className="text-[10px] md:text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Interactive Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white/40 md:bg-transparent min-h-[500px] md:min-h-0">
            {/* Header */}
            <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/20 shrink-0 bg-white/60 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all items-center gap-2",
                    step === 'upload' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-white/80 text-slate-400"
                  )}>
                    {step === 'upload' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    Step 01
                  </div>
                  <div className="w-8 h-px bg-slate-300 hidden sm:block" />
                  <div className={cn(
                    "flex px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all items-center gap-2",
                    step === 'processing' || step === 'done' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-white/80 text-slate-400"
                  )}>
                    {step === 'processing' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    Step 02
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="hidden md:flex text-slate-400 hover:text-slate-600 p-2.5 rounded-full hover:bg-white/80 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden p-4 md:p-10 flex items-center justify-center bg-slate-900/[0.04]">
              <AnimatePresence mode="wait">
                {step === 'upload' && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="w-full max-w-sm"
                  >
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-[3rem] border-4 border-dashed border-white/60 bg-white/40 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/60 hover:border-primary/40 transition-all group shadow-xl"
                    >
                      <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Upload className="text-primary" size={36} />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-base font-bold text-slate-700">点击上传照片</p>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-2">AI 将自动为您定位桌子</p>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="mt-8 flex items-center gap-3 bg-white/60 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/60 shadow-sm mx-auto w-fit">
                      <Info size={16} className="text-slate-400" />
                      <p className="text-[11px] text-slate-500 font-medium tracking-tight">推荐上传一张包含完整且空旷地面的广角照片</p>
                    </div>
                  </motion.div>
                )}

                {step === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-10"
                  >
                    <div className="relative w-40 h-40">
                       <div className="absolute inset-0 rounded-full border-8 border-primary/10" />
                       <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin" />
                       <div className="absolute inset-6 rounded-[2.5rem] bg-white flex items-center justify-center shadow-2xl overflow-hidden relative">
                          <Loader2 className="animate-pulse text-primary/30" size={48} />
                          <div className="absolute bottom-3 text-[8px] font-black tracking-widest text-primary/40 uppercase">Analyzing</div>
                       </div>
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">AI 智能分析与重构中...</h3>
                      <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                        正在使用 Nano Banana 解析房间深度、寻找理想摆放位置，并自动重组光影细节。
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col relative rounded-[3rem] overflow-hidden"
                  >
                    <div className="flex-1 min-h-0 bg-slate-900 overflow-hidden flex items-center justify-center">
                      <img
                        src={generatedImages[generatedImages.length - 1]}
                        className="w-full h-full object-contain"
                        alt="Fused Result"
                      />
                    </div>

                    <div className="h-24 bg-white/95 backdrop-blur-md px-8 flex items-center justify-between border-t border-slate-200 shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
                           <CheckCircle2 size={28} />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-lg font-bold text-slate-800 tracking-tight">集成完成！</h3>
                          <p className="text-xs text-slate-500 font-medium">您的设计已由 AI 智能安置在实景中。</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep('upload');
                            setTempPhoto(null);
                          }}
                          className="rounded-full px-8 h-12 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                        >
                          继续上传
                        </Button>
                        <Button
                          onClick={onClose}
                          className="rounded-full px-10 h-12 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                        >
                          立即预览
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
