import React from 'react';
import { useTableStore } from '../store/useTableStore';
import { FileDown, Download, Share2, Star, Settings2, FileText, Sparkles, Box, ChevronLeft, ChevronRight, FolderHeart, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AIHomeCustomizer } from '../components/AIIntegration/AIHomeCustomizer';
import { hslToHex } from '../components/ThreeViewer/TableModel';
import { createTableObject } from '../lib/tableExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const ShowcasePage: React.FC = () => {
  const { parameters, setViewMode, generatedImages, currentImageIndex, setCurrentImageIndex, userHomePhoto, saveWork, myWorks } = useTableStore();
  const [showDetails, setShowDetails] = React.useState(false);
  const [isHomeCustomizerOpen, setIsHomeCustomizerOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSaveWork = () => {
    const titles = [
      "藏在细节里的家居美学 | 极简主义桌案",
      "把一池冰川蓝搬进书房 | 我的未来感梦中情桌",
      "极简而不简单，这是一场关于原木的呼吸感知",
      "岩板的温润与金属的克制 | 现代客厅的新焦点"
    ];
    
    saveWork({
      title: titles[currentImageIndex] || titles[0],
      description: adsCopy[currentImageIndex]
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const adsCopy = [
    "晨曦微光穿透落地窗，科技感十足的金属线条在光影中跃动，为您开启诗意办公。设计不仅是形态，更是对生活质感的无声告白。",
    "午后，在这片极简设计的怀抱中，让思绪在冰蓝的纯净里自由驰骋。工业时代的硬朗与北欧的柔和，在这里达成了完美的静谧协议。",
    "夜幕降临，一盏暖灯映照出桌面的优雅弧度。这里不只是工作的起点，更是灵感爆发的圣地，每一处圆角都温柔承载着梦想的重量。",
    "大理石的冷冽与阳极氧化的精密，在现代都市的喧嚣中开辟出一片属于自己的禅意绿洲。删繁就简，只为留下最纯粹的触感体验。",
    "阳光房内，清新的空气伴随卓越的设计。结构之美在于平衡，而您的生活之美，在于每一个与完美家具相伴的精致瞬间。"
  ];

  const handleBack = () => {
    setViewMode('editor');
  };

  const handlePrev = () => {
    setCurrentImageIndex((currentImageIndex - 1 + generatedImages.length) % generatedImages.length);
  };

  const handleNext = () => {
    setCurrentImageIndex((currentImageIndex + 1) % generatedImages.length);
  };

  const handleDownloadManual = async () => {
    if (generatedImages.length === 0) return;
    
    const zip = new JSZip();
    const imgFolder = zip.folder("产品手册_场景渲染图");
    
    generatedImages.forEach((img, index) => {
      const base64Data = img.includes('base64,') ? img.split('base64,')[1] : null;
      if (base64Data) {
        imgFolder?.file(`场景预览_${index + 1}.png`, base64Data, { base64: true });
      }
    });

    // Add a simple metadata file
    zip.file("产品规格说明.txt", `
产品型号: TD-0313
桌长: ${parameters.tableLength}mm
桌宽: ${parameters.tableWidth}mm
高度: ${parameters.legHeight}mm
生成日期: ${new Date().toLocaleDateString()}
    `.trim());
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `产品手册_TD0313_${new Date().getTime()}.zip`);
  };

  const handleExportModel = () => {
    setIsExporting(true);
    try {
      const tableObject = createTableObject(parameters);
      const exporter = new OBJExporter();
      const result = exporter.parse(tableObject);
      const blob = new Blob([result], { type: 'text/plain' });
      saveAs(blob, `Table_Design_TD0313_${parameters.tableLength}x${parameters.tableWidth}.obj`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('模型导出失败，请重试。');
    } finally {
      setIsExporting(false);
    }
  };

  const getParamLabel = (key: string) => {
    const labels: Record<string, string> = {
      tableLength: '桌面长度',
      tableWidth: '桌面宽度',
      cornerRadius: '桌角圆弧',
      legHeight: '腿部高度',
      legWidth: '腿截面宽',
      legFlare: '腿张开度',
      legInset: '向内偏移',
      apronHeight: '支撑梁高',
      colorHue: '表面色相',
      metalness: '金属光泽',
      roughness: '微观粗糙'
    };
    return labels[key] || key;
  };

  const hexColor = React.useMemo(() => {
    const hex = hslToHex(parameters.colorHue, 70, 50);
    return `#${hex.toString(16).padStart(6, '0')}`;
  }, [parameters.colorHue]);

  return (
    <div className="h-screen w-screen atmosphere overflow-hidden relative flex flex-col font-sans text-slate-900">
      {/* Immersive Background Render */}
      <div 
        className="absolute inset-0 bg-transparent"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            {generatedImages.length > 0 ? (
              <img 
                src={generatedImages[currentImageIndex]} 
                alt={`Showcase Render ${currentImageIndex + 1}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black/5 flex items-center justify-center text-slate-400 backdrop-blur-sm">
                <Box size={48} className="animate-pulse text-primary/40" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Gradients for UI readability */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
      </div>

      {/* Top Header - Unified Editor Style */}
      <header className="relative z-20 h-16 glass px-6 flex items-center justify-between sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
            className="hover:bg-white/20 rounded-xl"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="w-[1px] h-6 bg-white/20 mx-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Box size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-800">场景展示</h1>
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest leading-none">最终效果预览</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">设计版本 TD-0313</span>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownloadManual}
            disabled={generatedImages.length === 0}
            className="h-9 rounded-full border-white/30 bg-white/40 backdrop-blur-sm text-slate-700 text-xs font-bold px-4 gap-2 shadow-none hover:bg-white/60 disabled:opacity-50"
          >
            <FileDown size={14} />
            下载产品手册
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportModel}
            disabled={isExporting}
            className="h-9 rounded-full border-white/30 bg-white/40 backdrop-blur-sm text-slate-700 text-xs font-bold px-4 gap-2 shadow-none hover:bg-white/60 disabled:opacity-50"
          >
            <Download size={14} className={isExporting ? "animate-pulse" : ""} />
            {isExporting ? "正在导出..." : "导出模型"}
          </Button>
          <Button 
            variant="default"
            onClick={() => setViewMode('library')}
            className="h-9 rounded-full bg-slate-800 text-white text-xs font-bold px-4 gap-2 shadow-lg hover:bg-slate-900 border-none"
          >
            <FolderHeart size={14} />
            作品库
          </Button>
        </div>
      </header>

      {/* Main UI Overlays */}
      <div className="flex-1 relative z-10 flex p-6 pointer-events-none overflow-hidden items-start justify-start">
        
        {/* Navigation Arrows */}
        <div className="flex items-center justify-between absolute inset-x-6 top-1/2 -translate-y-1/2 pointer-events-none">
          <Button 
            onClick={handlePrev} 
            className="w-12 h-12 rounded-full glass text-slate-600 hover:bg-white/60 pointer-events-auto shadow-none"
          >
            <ChevronLeft size={24} />
          </Button>
          <Button 
            onClick={handleNext} 
            className="w-12 h-12 rounded-full glass text-slate-600 hover:bg-white/60 pointer-events-auto shadow-none"
          >
            <ChevronRight size={24} />
          </Button>
        </div>

        {/* Sidebar Panel - Fixed card style, no folding */}
        <motion.div 
          layout
          drag
          dragConstraints={{ left: 0, right: 800, top: 0, bottom: 400 }}
          dragElastic={0.1}
          dragMomentum={false}
          animate={{ 
            height: 'auto',
            maxHeight: 'calc(100vh - 160px)',
            width: showDetails ? 420 : 320,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="glass rounded-[2rem] flex flex-col pointer-events-auto shadow-none overflow-hidden relative"
        >
          <div className="p-6 flex flex-col gap-6 h-full min-h-0">
            <div className="space-y-4 relative cursor-grab active:cursor-grabbing">
              {showDetails ? (
                 <div className="flex items-center gap-3">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     onPointerDown={(e) => e.stopPropagation()}
                     onClick={() => setShowDetails(false)}
                     className="w-8 h-8 rounded-lg hover:bg-white/20"
                   >
                     <ChevronLeft size={16} />
                   </Button>
                   <div className="flex flex-col">
                     <h2 className="text-base font-bold tracking-tight text-slate-800">设计场景详情</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Design Context</p>
                   </div>
                 </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">设计参数摘要</span>
                  </div>
                  
                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">TD-0313</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">科技冰蓝</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} className={cn("fill-primary text-primary", i === 5 && "fill-slate-200 text-slate-200")} />)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Button */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none">预估报价</span>
                      <div 
                        className="h-8 rounded-lg px-2.5 flex items-center gap-1.5 text-xs font-mono text-white font-bold"
                        style={{ background: 'linear-gradient(135deg, oklch(0.2 0 0) 0%, oklch(0.1 0 0) 100%)' }}
                      >
                         <span className="text-[10px] opacity-60">¥</span>
                         <span className="tracking-tight">7,999.00</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

              {showDetails ? (
                <div className="space-y-6 flex-1 min-h-0 flex flex-col">
                  {/* Scene Carousel Card */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 group">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        src={generatedImages[currentImageIndex]}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    
                    {/* Tiny Arrows on Image */}
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-none pointer-events-auto hover:bg-white"
                      >
                        <ChevronLeft size={14} />
                      </Button>
                      <Button 
                        size="icon" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-none pointer-events-auto hover:bg-white"
                      >
                        <ChevronRight size={14} />
                      </Button>
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                       {generatedImages.map((_, i) => (
                         <div key={i} className={cn("w-1 h-1 rounded-full transition-all", currentImageIndex === i ? "bg-white w-3" : "bg-white/40")} />
                       ))}
                    </div>
                  </div>

                  {/* Thumbnail Strip with Upload Button */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 custom-scrollbar shrink-0">
                    {generatedImages.map((img, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          "w-16 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                          currentImageIndex === i ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsHomeCustomizerOpen(true)}
                      className="w-16 h-10 rounded-lg border-2 border-dashed border-white/40 bg-white/20 flex flex-col items-center justify-center gap-0.5 shrink-0 hover:bg-white/40 hover:border-primary/40 transition-all text-slate-500"
                    >
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles size={10} className="text-primary" />
                      </div>
                      <span className="text-[7px] font-bold uppercase tracking-tighter">上传我家</span>
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                    <div className="bg-white/40 p-4 rounded-xl border border-white/20">
                      <p className="text-[11px] text-slate-600 leading-relaxed font-serif italic text-center px-2">
                        “{adsCopy[currentImageIndex]}”
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      我们为您精心挑选了 5 种不同维度的场景呈现，旨在展示该款家具在真实光照与材质细节下的卓越表现。每一张图片都代表了一种独特的生活主张。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 min-h-0 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">说明</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      该款设计强调金属与结构的平衡。采用高亮阳极氧化工艺，配备增强型直腿结构。
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">完整规格</h3>
                      <span className="px-1.5 py-0.5 bg-white/40 rounded text-[9px] font-mono font-bold text-slate-400 border border-white/20">BATCH-01</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(parameters).map(([key, value]) => (
                        <div key={key} className="bg-white/30 p-2.5 rounded-xl border border-white/20 flex flex-col gap-1 transition-all hover:bg-white/50">
                          <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">{getParamLabel(key)}</span>
                          <span className="text-[12px] font-bold text-primary font-mono">
                            {['tableLength', 'tableWidth', 'cornerRadius', 'legHeight', 'legWidth', 'legInset', 'apronHeight'].includes(key) 
                              ? `${value}mm` 
                              : key === 'colorHue' 
                                ? `${value}°`
                                : key === 'legFlare'
                                  ? `${value}°`
                                  : `${Math.round(value as number * 100)}%`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="grid grid-cols-2 gap-3 shrink-0 pt-4 border-t border-white/20 mt-auto">
                <Button 
                  variant="ghost" 
                  onPointerDown={(e) => e.stopPropagation()} 
                  onClick={handleSaveWork}
                  disabled={isSaved}
                  className={cn(
                    "bg-white/30 hover:bg-white/50 text-slate-600 border border-white/20 rounded-xl flex items-center justify-center gap-2 h-11 transition-all",
                    isSaved && "text-primary bg-primary/10 border-primary/20"
                  )}
                >
                  <Save size={15} />
                  <span className="text-xs font-bold">{isSaved ? "已保存" : "保存至库"}</span>
                </Button>
                <Button 
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setShowDetails(!showDetails)}
                  className={cn(
                    "rounded-xl flex items-center justify-center gap-2 h-11 shadow-none border-none transition-all active:scale-95 text-white font-bold",
                    showDetails 
                      ? "bg-slate-800 hover:bg-slate-900" 
                      : ""
                  )}
                  style={!showDetails ? {
                    background: 'linear-gradient(135deg, oklch(0.7 0.12 180) 0%, oklch(0.65 0.12 220) 100%)'
                  } : {}}
                >
                  {showDetails ? <Settings2 size={15} /> : <FileText size={15} />}
                  <span className="text-xs font-bold">{showDetails ? "参数" : "详情"}</span>
                </Button>
              </div>
            </div>
        </motion.div>

        {/* Page indicator dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
          {generatedImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentImageIndex === i ? "w-6" : "w-1.5 bg-white/60 hover:bg-white"
              )}
              style={currentImageIndex === i ? {
                background: 'linear-gradient(to right, oklch(0.7 0.12 180), oklch(0.65 0.12 220))'
              } : {}}
            />
          ))}
        </div>
      </div>
      <AIHomeCustomizer 
        isOpen={isHomeCustomizerOpen} 
        onClose={() => setIsHomeCustomizerOpen(false)} 
      />
    </div>
  );
};

const architecturalStyles = [
  '现代简约北欧风',
  '工业LOFT复古风',
  '日式禅意木质空间',
  '高奢大理石意式现代',
  '明亮通透的阳光房'
];
