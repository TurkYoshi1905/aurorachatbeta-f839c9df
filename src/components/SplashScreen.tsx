import { useState, useEffect } from 'react';

interface SplashScreenProps {
  loadingSteps: { label: string; done: boolean }[];
  allDone: boolean;
  onEnter: () => void;
}

const SplashScreen = ({ loadingSteps, allDone, onEnter }: SplashScreenProps) => {
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => {
        setEntering(true);
        setTimeout(onEnter, 600);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [allDone, onEnter]);

  return (
    <div className={`h-screen w-screen bg-server-bg flex flex-col items-center justify-center transition-opacity duration-500 ${entering ? 'opacity-0 scale-105' : 'opacity-100'}`}>
      {/* Aurora glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: 'radial-gradient(circle, hsl(175, 70%, 50%) 0%, hsl(265, 60%, 55%) 50%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
          <span className="text-3xl font-bold text-primary-foreground">A</span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">AuroraChat</h1>
          <p className="text-sm text-muted-foreground">
            {entering ? 'Uygulamaya Giriş Yapılıyor...' : 'Yükleniyor...'}
          </p>
        </div>

        {/* Loading steps */}
        <div className="space-y-2 w-56">
          {loadingSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step.done ? 'bg-status-online' : 'bg-muted-foreground/30 animate-pulse'}`} />
              <span className={`text-xs transition-colors duration-300 ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(loadingSteps.filter(s => s.done).length / loadingSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
