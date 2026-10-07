import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="py-20">
      <EmptyState title="404 — Page not found" hint="The page you're looking for doesn't exist." />
      <div className="mt-4 text-center">
        <Link to="/" className="btn-accent inline-block">
          Back to Markets
        </Link>
      </div>
    </div>
  );
}
