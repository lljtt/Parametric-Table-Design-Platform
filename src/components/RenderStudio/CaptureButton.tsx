import React, { useState } from 'react';
import { Camera, Loader2, Image as ImageIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { generateImage } from '../../services/openclawClient';
import { useTableStore } from '../../store/useTableStore';

export const CaptureButton: React.FC = () => {
  const [isRendering, setIsRendering] = useState(false);
  const { scenePrompt, setIsCapturing, setGeneratedImages, setCurrentImageIndex, setViewMode, setCapturedSnapshot } = useTableStore();

  const handleCaptureAndRender = async () => {
    setIsRendering(true);
    try {
      // 1. Prepare for capture: Hide grid and UI
      setIsCapturing(true);

      // Wait a bit for React to re-render and Three.js to draw a frame without the grid
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. Capture screenshot from Three.js canvas
      const canvas = document.querySelector('canvas');
      if (!canvas) throw new Error('Canvas not found');

      // Get base64 data (without the prefix)
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      // Restore UI
      setIsCapturing(false);

      // 3. Navigate immediately to showcase view
      setCapturedSnapshot(dataUrl);
      setGeneratedImages([]);
      setCurrentImageIndex(0);
      setViewMode('showcase');

      // 4. Generate 5 distinct scenes
      const architecturalStyles = [
        '现代简约北欧风',
        '工业LOFT复古风',
        '日式禅意木质空间',
        '高奢大理石意式现代',
        '明亮通透的阳光房'
      ];

      const renderingRequests = architecturalStyles.map(style =>
        generateImage(
          [{ data: base64Data, mimeType: 'image/png' }],
          `基于提供的桌子图像，将其无缝融合到一个真实的${style}室内空间中。
          保持桌子的形态、比例和颜色、材质绝对不变。
          添加合理的环境光影、阴影和透视关系。
          最终输出应为一张用于产品 catalogue 的高品质专业产品摄影照片。`
        )
      );

      // Execute all requests
      const newImages = await Promise.all(renderingRequests);
      setGeneratedImages(newImages);
    } catch (error) {
      console.error('Rendering Error:', error);
      alert('Failed to generate rendering. Please try again.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleCaptureAndRender}
        disabled={isRendering}
        className="px-6 h-10 hover:brightness-105 text-white rounded-full font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.95] border-none shadow-none"
        style={{
          background: 'linear-gradient(135deg, oklch(0.7 0.12 180) 0%, oklch(0.65 0.12 220) 100%)'
        }}
      >
        {isRendering ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            正在进入场景...
          </>
        ) : (
          <>
            <CheckCircle2 size={16} className="text-white/90" />
            <span className="tracking-wide">确认设计进入场景展示</span>
            <ChevronRight size={16} className="text-white/70" />
          </>
        )}
      </Button>
    </>
  );
};
