import { useState, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2 } from 'lucide-react';


const GIPHY_API_KEY = 'yYrhkp1WvT2DmLzN0oH3htGlGCAHACoy';

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  children?: React.ReactNode;
}

interface GiphyGif {
  id: string;
  title: string;
  preview: string;
  url: string;
}

const GifPicker = ({ onGifSelect, children }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);

  const mapResults = (data: any[]): GiphyGif[] =>
    data.map((g) => ({
      id: g.id,
      title: g.title || '',
      preview: g.images?.fixed_height_small?.url || g.images?.fixed_height?.url || '',
      url: g.images?.original?.url || '',
    }));

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`);
      const json = await res.json();
      setGifs(mapResults(json.data || []));
    } catch {
      setGifs([]);
    }
    setLoading(false);
  }, []);

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) { fetchTrending(); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=20&rating=g`);
      const json = await res.json();
      setGifs(mapResults(json.data || []));
    } catch {
      setGifs([]);
    }
    setLoading(false);
  }, [fetchTrending]);

  useEffect(() => {
    if (open) fetchTrending();
  }, [open, fetchTrending]);

  const handleSelect = (gif: GiphyGif) => {
    onGifSelect(gif.url);
    setOpen(false);
    setSearch('');
    setGifs([]);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(''); setGifs([]); } }}>
      <PopoverTrigger asChild>
        {children || (
          <button className="hover:text-foreground transition-colors text-muted-foreground">
            <span className="material-symbols-outlined text-2xl opacity-70 hover:opacity-100 transition-opacity">gif</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border-border" side="top" align="end">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); searchGifs(e.target.value); }}
            placeholder="GIF ara..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="h-64 overflow-y-auto scrollbar-thin p-2">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && gifs.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              GIF bulunamadı
            </div>
          )}
          {!loading && gifs.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif)}
                  className="rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                >
                  <img src={gif.preview} alt={gif.title} className="w-full h-24 object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-3 py-1.5 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">Powered by GIPHY</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GifPicker;
