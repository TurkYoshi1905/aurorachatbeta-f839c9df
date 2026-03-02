import { useNavigate } from 'react-router-dom';
import { changelogData } from '@/data/changelogData';
import { ArrowLeft, Sparkles } from 'lucide-react';

const Changelog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Güncelleme Notları</h1>
            <p className="text-sm text-muted-foreground">Tüm sürüm geçmişi</p>
          </div>
        </div>

        <div className="space-y-4">
          {changelogData.map((release) => (
            <button
              key={release.version}
              onClick={() => navigate(`/changelog/${release.version.replace(/\./g, '-')}`)}
              className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 p-5 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    v{release.version}
                  </span>
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>
                <Sparkles className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground">{release.summary}</p>
              <div className="flex gap-2 mt-3">
                {release.sections.map((s) => (
                  <span key={s.title} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {s.title}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Changelog;
