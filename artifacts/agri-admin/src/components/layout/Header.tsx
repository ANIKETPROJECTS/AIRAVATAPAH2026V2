import { useState, useEffect } from "react";
import { Bell, User, MessageSquare } from "lucide-react";

export default function Header({ onAIOpen }: { onAIOpen: () => void }) {
  const [time, setTime] = useState(new Date());

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
        <button
          onClick={onAIOpen}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
        </button>
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
