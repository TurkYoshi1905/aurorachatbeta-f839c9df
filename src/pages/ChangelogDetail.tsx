import { useParams, useNavigate } from 'react-router-dom';
import { changelogData } from '@/data/changelogData';
import { ArrowLeft } from 'lucide-react';

const ChangelogDetail = () => {
  const { version } = useParams<{ version: string }>();
  const navigate = useNavigate();

  const versionDotted = version?.replace(/-/g, '.') || '';
  const release = changelogData.find((r) => r.version === versionDotted);

  if (!release) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">Sürüm bulunamadı</p>
          <button onClick={() => navigate('/changelog')} className="text-primary hover:underline text-sm">
            ← Tüm sürümlere dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/changelog')}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                v{release.version}
              </span>
              <span className="text-sm text-muted-foreground">{release.date}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {release.sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <section.icon className={`w-4 h-4 ${section.color}`} />
                <p className="text-sm font-semibold text-foreground">{section.title}</p>
              </div>
              <ul className="space-y-2 ml-6">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground list-disc leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogDetail;
