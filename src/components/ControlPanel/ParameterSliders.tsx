import React from 'react';
import { useTableStore, TableParameters } from '../../store/useTableStore';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Box, Layout, Palette, Database, Eye, ChevronUp, ChevronDown, Shield, Trees, Box as BoxIcon } from 'lucide-react';
import { hslToHex } from '../ThreeViewer/TableModel';

const materialOptions = [
  { id: 'anodized', label: '金属阳极氧化', icon: Shield },
  { id: 'wood', label: '实木纹理', icon: Trees },
  { id: 'slate', label: '哑光岩板', icon: BoxIcon },
] as const;

interface ParameterConfig {
  key: keyof TableParameters;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const sections = [
  {
    title: '桌面尺寸',
    icon: <Box size={14} className="text-primary" />,
    params: [
      { key: 'tableLength', label: '桌面长度', description: '控制桌面的纵向长度', min: 1200, max: 2400, step: 10, unit: 'mm' },
      { key: 'tableWidth', label: '桌面宽度', description: '控制桌面的横向宽度', min: 600, max: 1200, step: 10, unit: 'mm' },
      { key: 'cornerRadius', label: '桌角圆弧', description: '桌面四角的平滑半径', min: 0, max: 150, step: 1, unit: 'mm' },
    ] as ParameterConfig[]
  },
  {
    title: '腿部结构',
    icon: <Layout size={14} className="text-primary" />,
    params: [
      { key: 'legHeight', label: '腿部高度', description: '桌腿离地高度，决定桌子高矮', min: 700, max: 1050, step: 5, unit: 'mm' },
      { key: 'legWidth', label: '腿截面宽', description: '桌腿截面的厚度与视觉重感', min: 40, max: 120, step: 2, unit: 'mm' },
      { key: 'legFlare', label: '腿张开度', description: '桌腿向外倾斜的舒展角度', min: 0, max: 15, step: 0.5, unit: '°' },
      { key: 'legInset', label: '向内偏移', description: '桌腿相对于桌角内缩的间距', min: 0, max: 200, step: 5, unit: 'mm' },
    ] as ParameterConfig[]
  },
  {
    title: '桌架 & 材质',
    icon: <Palette size={14} className="text-primary" />,
    params: [
      { key: 'apronHeight', label: '支撑梁高', description: '桌面下支撑框架的侧边高度', min: 40, max: 120, step: 5, unit: 'mm' },
      { key: 'colorHue', label: '表面色相', description: '材质颜色的基础色相值', min: 0, max: 360, step: 1, unit: '°' },
      { key: 'metalness', label: '金属光泽', description: '表面反光呈现的金属质感强弱', min: 0, max: 1, step: 0.01, unit: '' },
      { key: 'roughness', label: '微观粗糙', description: '表面的微观漫反射程度', min: 0, max: 1, step: 0.01, unit: '' },
    ] as ParameterConfig[]
  }
];

const NumberInput = ({ 
  value, 
  min, 
  max, 
  step, 
  unit, 
  onChange 
}: { 
  value: number, 
  min: number, 
  max: number, 
  step: number, 
  unit: string,
  onChange: (val: number) => void 
}) => {
  const [inputValue, setInputValue] = React.useState((value ?? 0).toString());

  React.useEffect(() => {
    setInputValue((value ?? 0).toString());
  }, [value]);

  const handleBlur = () => {
    let num = parseFloat(inputValue);
    if (isNaN(num)) num = value;
    num = Math.max(min, Math.min(max, num));
    onChange(num);
    setInputValue(num.toString());
  };

  const adjust = (delta: number) => {
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };

  return (
    <div className="flex items-center group">
      <div className="relative flex items-center h-7 bg-white/40 border border-white/30 rounded-full overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-all">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          className="w-11 bg-transparent px-2 text-[10px] font-mono font-bold text-primary outline-none text-right"
        />
        {unit && (
          <span className="text-[9px] text-slate-400 font-mono font-bold select-none pr-1">{unit}</span>
        )}
        <div className="flex flex-col border-l border-white/20 h-full">
          <button 
            onClick={() => adjust(step)}
            className="flex-1 px-1.5 hover:bg-white/20 transition-colors border-b border-white/10 text-primary/60 flex items-center justify-center"
          >
            <ChevronUp size={8} strokeWidth={4} />
          </button>
          <button 
            onClick={() => adjust(-step)}
            className="flex-1 px-1.5 hover:bg-white/20 transition-colors text-primary/60 flex items-center justify-center"
          >
            <ChevronDown size={8} strokeWidth={4} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ParameterSliders: React.FC = () => {
  const { parameters, setParameters } = useTableStore();

  const handleChange = React.useCallback((key: keyof TableParameters, value: number) => {
    setParameters({ [key]: value });
  }, [setParameters]);

  const hexColor = React.useMemo(() => {
    const hex = hslToHex(parameters.colorHue, 70, 50);
    return `#${hex.toString(16).padStart(6, '0')}`;
  }, [parameters.colorHue]);

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-600 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 bg-transparent">
        <div className="p-4 space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/30 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-white/50 rounded-full flex items-center justify-center">
                  {section.icon}
                </div>
                <h3 className="text-[10px] font-bold text-slate-700 tracking-[0.15em] uppercase">{section.title}</h3>
              </div>
              
              <div className="space-y-6">
                {section.params.map((config) => (
                  <div key={config.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={config.key} className="text-[11px] font-semibold text-slate-800 tracking-tight">
                        {config.label}
                      </Label>
                      <NumberInput 
                        value={parameters[config.key] as number} 
                        min={config.min} 
                        max={config.max} 
                        step={config.step} 
                        unit={config.unit}
                        onChange={(val) => handleChange(config.key, val)}
                      />
                    </div>
                    
                    <div className="relative">
                      {config.key === 'colorHue' ? (
                        <div className="relative h-3 w-full rounded-full my-2 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]" style={{
                          background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                        }}>
                          <Slider
                            id={config.key}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            value={[parameters[config.key] as number ?? 0]}
                            onValueChange={(val) => handleChange(config.key, val[0])}
                            className="absolute inset-0 w-full"
                          />
                        </div>
                      ) : (
                        <Slider
                          id={config.key}
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          value={[parameters[config.key] as number ?? 0]}
                          onValueChange={(val) => handleChange(config.key, val[0])}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* New Material Selection Section in Sidebar */}
          <div className="bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/30 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/50 rounded-full flex items-center justify-center">
                <Palette size={14} className="text-primary" />
              </div>
              <h3 className="text-[10px] font-bold text-slate-700 tracking-[0.15em] uppercase">材质预设</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {materialOptions.map((opt) => {
                const isActive = parameters.materialCategory === opt.id;
                
                // Sphere styles based on material
                const getSphereStyle = () => {
                  switch (opt.id) {
                    case 'anodized':
                      return {
                        background: `radial-gradient(circle at 30% 30%, ${hexColor}, oklch(0.4 0.1 210))`,
                        boxShadow: `inset -2px -2px 6px rgba(0,0,0,0.5), inset 2px 2px 6px rgba(255,255,255,0.4)`
                      };
                    case 'wood':
                      return {
                        background: `radial-gradient(circle at 30% 30%, oklch(0.7 0.08 45), oklch(0.3 0.1 30))`,
                        boxShadow: `inset -2px -2px 8px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.1)`
                      };
                    case 'slate':
                      return {
                        background: `radial-gradient(circle at 30% 30%, oklch(0.5 0.01 240), oklch(0.2 0.01 240))`,
                        boxShadow: `inset -1px -1px 10px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(255,255,255,0.05)`
                      };
                  }
                };

                return (
                  <button
                    key={opt.id}
                    onClick={() => setParameters({ materialCategory: opt.id })}
                    className="flex flex-col items-center group gap-2"
                  >
                    <div className={`
                      w-12 h-12 rounded-full transition-all duration-300 relative
                      ${isActive ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-transparent' : 'opacity-70 grayscale hover:opacity-100 hover:grayscale-0'}
                    `}
                    style={getSphereStyle()}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10 rounded-full" />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                      {opt.label.replace('纹理', '').replace('阳极氧化', '').replace('哑光', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Data Grid */}
          <div className="bg-white/30 backdrop-blur-md p-4 rounded-[2rem] border border-white/20 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/50 rounded-full flex items-center justify-center">
                <Database size={12} className="text-primary" />
              </div>
              <h3 className="text-[10px] font-bold text-slate-700 tracking-[0.15em] uppercase">实时参数</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(parameters).map(([key, value]) => {
                const config = sections.flatMap(s => s.params).find(p => p.key === key);
                if (!config && key !== 'materialCategory') return null;
                
                const label = config ? config.label : '当前材质';
                const displayValue = key === 'materialCategory' 
                  ? (materialOptions.find(o => o.id === value)?.label?.slice(0, 2) || '材质')
                  : `${value}${config?.unit || ''}`;

                return (
                  <div key={key} className="bg-white/40 p-2.5 rounded-2xl border border-white/20 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider">{label}</span>
                    <span className="text-[11px] font-bold text-primary font-mono tracking-tight overflow-hidden text-ellipsis whitespace-nowrap w-full text-center">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Material Preview */}
          <div className="bg-white/30 backdrop-blur-md p-4 rounded-[2rem] border border-white/20 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/50 rounded-full flex items-center justify-center">
                <Eye size={12} className="text-primary" />
              </div>
              <h3 className="text-[10px] font-bold text-slate-700 tracking-[0.15em] uppercase">材质外观</h3>
            </div>
            <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border border-white/10">
              <div 
                className="w-14 h-14 rounded-full border border-white/50 relative overflow-hidden shrink-0"
                style={{ 
                  backgroundColor: hexColor,
                  boxShadow: `inset 0 0 15px rgba(255,255,255,${(100 - parameters.roughness) / 200})`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-60" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-800">
                  色调 <span className="text-primary">{parameters.colorHue}°</span> · 
                  金属感 <span className="text-primary">{Math.round(parameters.metalness * 100)}%</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  表面粗糙度 {Math.round(parameters.roughness * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
