import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

const ImageLightbox = ({ images, currentIndex, open, onOpenChange, onIndexChange }: ImageLightboxProps) => {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goPrev = useCallback(() => { if (hasPrev) onIndexChange(currentIndex - 1); }, [hasPrev, currentIndex, onIndexChange]);
  const goNext = useCallback(() => { if (hasNext) onIndexChange(currentIndex + 1); }, [hasNext, currentIndex, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goPrev, goNext, onOpenChange]);

  const handleDownload = () => {
    const url = images[currentIndex];
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || 'image';
    a.target = '_blank';
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden flex items-center justify-center [&>button]:hidden">
        <button onClick={() => onOpenChange(false)} className="absolute top-3 right-3 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <button onClick={handleDownload} className="absolute top-3 right-14 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
          <Download className="w-5 h-5" />
        </button>

        {hasPrev && (
          <button onClick={goPrev} className="absolute left-3 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && (
          <button onClick={goNext} className="absolute right-3 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-[90vh] object-contain select-none"
          draggable={false}
        />

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => onIndexChange(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
