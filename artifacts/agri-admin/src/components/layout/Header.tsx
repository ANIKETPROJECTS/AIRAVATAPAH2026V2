import { useState, useEffect } from "react";
import { Bell, User } from "lucide-react";
import { useLang, type LangCode } from "@/contexts/LanguageContext";

const LANG_OPTS: { code: LangCode; label: string }[] = [
  { code: "mr", label: "म" },
  { code: "hi", label: "हि" },
  { code: "en", label: "En" },
];

export default function Header() {
  const [time, setTime] = useState(new Date());
  const { lang, setLang } = useLang();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
      <div className="text-sm text-muted-foreground">
        {time.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        {" · "}
        {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-1 uppercase tracking-wide font-semibold hidden sm:inline">भाषा:</span>
          {LANG_OPTS.map(o => (
            <button
              key={o.code}
              onClick={() => setLang(o.code)}
              className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                lang === o.code
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-card border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden md:block text-xs">
            <div className="font-semibold text-foreground">Rajesh Kumar</div>
            <div className="text-muted-foreground">District Agricultural Officer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
