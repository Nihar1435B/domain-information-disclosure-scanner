import { AuthForm } from '../components/AuthForm';

export const AuthPage = () => {
  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <div className="relative inline-block">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-secondary rounded-lg blur-lg opacity-50"></div>
          <h1 className="relative text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400 py-2">
            GuardianLens
          </h1>
        </div>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
          Secure your digital footprint. Log in to start scanning and manage your web assets.
        </p>
      </div>
      <AuthForm />
    </div>
  );
};
