import { X } from 'lucide-react';

interface FileUploadPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  uploading?: boolean;
}

const FileUploadPreview = ({ files, onRemove, uploading }: FileUploadPreviewProps) => {
  if (files.length === 0) return null;

  return (
    <div className="px-4 pt-2">
      <div className="bg-secondary/50 rounded-lg p-2 flex gap-2 flex-wrap border border-border/30">
        {files.map((file, i) => (
          <div key={i} className="relative group w-24 h-24 rounded-md overflow-hidden border border-border/50">
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`}
            />
            {!uploading && (
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadPreview;
