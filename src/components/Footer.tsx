export const Footer = () => {
  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-6 px-4 md:flex-row">
        <p className="text-sm text-text-secondary">
          © {new Date().getFullYear()} GuardianLens. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">Terms of Service</a>
          <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};
