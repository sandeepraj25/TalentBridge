import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Compass className="h-7 w-7" />
      </div>
      <p className="mt-6 font-display text-6xl font-semibold text-ink">404</p>
      <h1 className="mt-2 text-xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  );
}
