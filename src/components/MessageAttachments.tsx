import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface MessageAttachmentsProps {
  attachments: string[];
}

const MessageAttachments = ({ attachments }: MessageAttachmentsProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  if (!attachments || attachments.length === 0) return null;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const gridClass =
    attachments.length === 1 ? 'grid-cols-1 max-w-lg' :
    attachments.length === 2 ? 'grid-cols-2 max-w-lg' :
    'grid-cols-2 max-w-lg';

  return (
    <>
      <div className={`grid gap-1 mt-1.5 ${gridClass}`}>
        {attachments.map((url, i) => (
          <div
            key={i}
            className={`relative rounded-lg overflow-hidden cursor-pointer group border border-border/30 ${
              attachments.length === 3 && i === 0 ? 'col-span-2' : ''
            }`}
            onClick={() => !failedImages.has(i) && openLightbox(i)}
          >
            {failedImages.has(i) ? (
              <div className="w-full h-32 bg-secondary/50 flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={url}
                alt=""
                className="w-full h-auto max-h-72 object-cover transition-transform group-hover:scale-[1.02]"
                loading="lazy"
                onError={() => setFailedImages((prev) => new Set(prev).add(i))}
              />
            )}
          </div>
        ))}
      </div>
      <ImageLightbox
        images={attachments.filter((_, i) => !failedImages.has(i))}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
};

export default MessageAttachments;
