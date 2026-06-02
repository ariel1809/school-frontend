import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background bg-grid-dots">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-soft">
          <Compass className="h-8 w-8" />
        </div>
        <div className="mt-6 font-display text-7xl font-semibold tracking-tight text-foreground">
          404
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Page introuvable
        </h1>
        <p className="mt-2 text-muted-foreground">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}