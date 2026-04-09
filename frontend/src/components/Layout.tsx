import { Link, useLocation } from "wouter";
import { Youtube, Home, List, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

function NavLink({ href, children, icon }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Youtube className="w-6 h-6 text-red-500" />
            <span>Pro Transcriber</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/" icon={<Home className="w-4 h-4" />}>Home</NavLink>
            <NavLink href="/playlist" icon={<List className="w-4 h-4" />}>Playlist</NavLink>
            <NavLink href="/history" icon={<Clock className="w-4 h-4" />}>History</NavLink>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
