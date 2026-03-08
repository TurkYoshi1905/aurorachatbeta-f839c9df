import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus, Search } from 'lucide-react';

// Emoji keyword map for search
const EMOJI_KEYWORDS: Record<string, string[]> = {
  '😀': ['grin','smile','happy','gülümseme','mutlu'],
  '😃': ['smile','happy','gülümseme'],
  '😄': ['smile','happy','laugh','gül'],
  '😁': ['grin','teeth','diş'],
  '😆': ['laugh','haha','gülme','kahkaha'],
  '😅': ['sweat','nervous','terli'],
  '🤣': ['rofl','lol','laugh','gülme'],
  '😂': ['joy','tears','laugh','gülme','gözyaşı'],
  '🙂': ['smile','hafif','gülümseme'],
  '😉': ['wink','göz','kırpma'],
  '😊': ['blush','shy','utanma'],
  '😇': ['angel','melek','halo'],
  '🥰': ['love','hearts','aşk','kalp'],
  '😍': ['heart eyes','aşk','kalp','gözler'],
  '🤩': ['star','struck','yıldız','heyecan'],
  '😘': ['kiss','öpücük'],
  '😗': ['kiss','öpücük'],
  '😚': ['kiss','öpücük'],
  '😙': ['kiss','öpücük'],
  '😋': ['yum','delicious','lezzetli'],
  '😛': ['tongue','dil'],
  '😜': ['wink','tongue','dil','göz'],
  '🤪': ['crazy','deli','çılgın'],
  '😝': ['tongue','dil'],
  '🤑': ['money','para'],
  '🤗': ['hug','sarılma'],
  '🤔': ['think','düşünme','hmm'],
  '🤐': ['zipper','sus'],
  '🤨': ['raised brow','kaş'],
  '😐': ['neutral','nötr'],
  '😑': ['expressionless','ifadesiz'],
  '😶': ['silent','sessiz'],
  '😏': ['smirk','sırıtma'],
  '😒': ['unamused','keyifsiz'],
  '🙄': ['eye roll','göz devir'],
  '😬': ['grimace','yüz buruşturma'],
  '😌': ['relieved','rahat'],
  '😔': ['sad','pensive','üzgün'],
  '😪': ['sleepy','uykulu'],
  '😴': ['sleep','zzz','uyku'],
  '😷': ['mask','maske','hasta'],
  '🤒': ['sick','thermometer','hasta'],
  '🤕': ['hurt','bandage','yaralı'],
  '🤢': ['nausea','sick','mide','bulantı'],
  '🤮': ['vomit','sick','kusma'],
  '🥵': ['hot','sıcak'],
  '🥶': ['cold','soğuk'],
  '🥴': ['dizzy','woozy','baş','dönme'],
  '😵': ['dizzy','baş','dönme'],
  '🤯': ['mind blown','şok'],
  '🤠': ['cowboy','kovboy'],
  '🥳': ['party','celebrate','kutlama','parti'],
  '😎': ['cool','sunglasses','havalı'],
  '🤓': ['nerd','inek'],
  '😕': ['confused','karışık'],
  '😟': ['worried','endişeli'],
  '😮': ['surprised','şaşkın'],
  '😲': ['astonished','şaşkın'],
  '😳': ['flushed','utanma'],
  '🥺': ['pleading','yalvarma'],
  '😢': ['cry','ağlama'],
  '😭': ['sob','cry','ağlama','gözyaşı'],
  '😱': ['scream','fear','korku','çığlık'],
  '😤': ['angry','kızgın','öfke'],
  '😡': ['angry','mad','kızgın','öfke'],
  '😠': ['angry','kızgın'],
  '🤬': ['swear','curse','küfür'],
  '😈': ['devil','şeytan'],
  '👿': ['devil','angry','şeytan'],
  '💀': ['skull','death','kafatası','ölüm'],
  '💩': ['poop','poo','kaka'],
  '🤡': ['clown','palyaço'],
  '👻': ['ghost','hayalet'],
  '👽': ['alien','uzaylı'],
  '🤖': ['robot'],
  '❤️': ['heart','love','kalp','aşk','kırmızı'],
  '🧡': ['orange','heart','turuncu','kalp'],
  '💛': ['yellow','heart','sarı','kalp'],
  '💚': ['green','heart','yeşil','kalp'],
  '💙': ['blue','heart','mavi','kalp'],
  '💜': ['purple','heart','mor','kalp'],
  '🖤': ['black','heart','siyah','kalp'],
  '🤍': ['white','heart','beyaz','kalp'],
  '💔': ['broken','heart','kırık','kalp'],
  '🔥': ['fire','ateş','alev'],
  '✨': ['sparkles','stars','yıldız','parıltı'],
  '⭐': ['star','yıldız'],
  '🌟': ['star','glowing','yıldız'],
  '💯': ['hundred','perfect','yüz','mükemmel'],
  '👍': ['thumbs up','like','beğen','tamam'],
  '👎': ['thumbs down','dislike','beğenme'],
  '👋': ['wave','hello','merhaba','el','salla'],
  '👏': ['clap','alkış'],
  '🙌': ['raised hands','eller','yukarı'],
  '🤝': ['handshake','tokalaşma'],
  '🙏': ['pray','please','dua','lütfen'],
  '💪': ['strong','muscle','güçlü','kas'],
  '👀': ['eyes','look','göz','bak'],
  '🐶': ['dog','köpek'],
  '🐱': ['cat','kedi'],
  '🐻': ['bear','ayı'],
  '🦊': ['fox','tilki'],
  '🐼': ['panda'],
  '🐸': ['frog','kurbağa'],
  '🍕': ['pizza'],
  '🍔': ['burger','hamburger'],
  '🍟': ['fries','patates'],
  '🍰': ['cake','pasta','kek'],
  '☕': ['coffee','kahve'],
  '🍺': ['beer','bira'],
  '⚽': ['soccer','football','futbol'],
  '🏀': ['basketball','basketbol'],
  '🎮': ['game','controller','oyun'],
  '🎵': ['music','note','müzik','nota'],
  '🎶': ['music','notes','müzik'],
  '✅': ['check','done','tamam','onay'],
  '❌': ['cross','no','hayır','iptal'],
  '⚠️': ['warning','uyarı','dikkat'],
  '💬': ['speech','comment','yorum','mesaj'],
  '👑': ['crown','king','queen','kral','kraliçe','taç'],
};

const EMOJI_CATEGORIES = [
  {
    name: '😀',
    label: 'Yüzler',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  },
  {
    name: '👋',
    label: 'Eller',
    emojis: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'],
  },
  {
    name: '🐶',
    label: 'Hayvanlar',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮'],
  },
  {
    name: '🍔',
    label: 'Yiyecekler',
    emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🫘','🍯'],
  },
  {
    name: '⚽',
    label: 'Aktiviteler',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🕹️','🎰'],
  },
  {
    name: '❤️',
    label: 'Semboller',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆙','🆗','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

const EmojiPicker = ({ onEmojiSelect, children }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const query = search.toLowerCase().trim();
    const all: string[] = [];
    EMOJI_CATEGORIES.forEach(c => all.push(...c.emojis));
    return all.filter(emoji => {
      const keywords = EMOJI_KEYWORDS[emoji];
      if (keywords) {
        return keywords.some(k => k.includes(query));
      }
      return false;
    });
  }, [search]);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <button className="hover:text-foreground transition-colors text-muted-foreground">
            <SmilePlus className="w-5 h-5" />
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
            placeholder="Emoji ara..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 px-2 py-1.5 border-b border-border">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => { setActiveCategory(i); setSearch(''); }}
              className={`w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-secondary transition-colors ${activeCategory === i && !search ? 'bg-secondary' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="h-52 overflow-y-auto scrollbar-thin p-2">
          {!search && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1">
                {EMOJI_CATEGORIES[activeCategory].label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
          {search && filteredEmojis && (
            filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-0.5">
                {filteredEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sonuç bulunamadı</p>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
