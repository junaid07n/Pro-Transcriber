import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <h1 className="text-8xl font-bold text-muted-foreground/30">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground">The page you are looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </Layout>
  );
}
