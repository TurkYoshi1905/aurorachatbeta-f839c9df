import { useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Gift, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  children?: React.ReactNode;
}

interface TenorGif {
  id: string;
  title: string;
  preview: string;
  url: string;
}

const GifPicker = ({ onGifSelect, children }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenor-search', {
        body: { query: query.trim(), limit: 20 },
      });
      if (!error && data?.results) {
        setGifs(data.results);
      } else {
        setGifs([]);
      }
    } catch {
      setGifs([]);
    }
    setLoading(false);
  }, []);

  const handleSelect = (gif: TenorGif) => {
    onGifSelect(gif.url);
    setOpen(false);
    setSearch('');
    setGifs([]);
    setSearched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchGifs(search);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(''); setGifs([]); setSearched(false); } }}>
      <PopoverTrigger asChild>
        {children || (
          <button className="hover:text-foreground transition-colors text-muted-foreground">
            <Gift className="w-5 h-5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border-border" side="top" align="end">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
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
          {!loading && !searched && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              GIF aramak için yazın ve Enter'a basın
            </div>
          )}
          {!loading && searched && gifs.length === 0 && (
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
          <p className="text-[10px] text-muted-foreground text-center">Powered by Tenor</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GifPicker;
