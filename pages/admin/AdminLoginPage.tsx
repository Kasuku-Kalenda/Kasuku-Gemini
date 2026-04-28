import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ParrotIcon } from '../../components/icons/ParrotIcon';
import { Button } from '../../components/ui/Button';

type View = 'adminDashboard' | 'home';

interface AdminLoginPageProps {
  navigateTo: (view: View) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('curiositus@kasuku.com');
  const [password, setPassword] = useState('SetAStrongPasswordHere');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await signIn({ email, pass: password });

    setIsLoading(false);
    if (success) {
      navigateTo('adminDashboard');
    } else {
      setError('Connexion échouée. Vérifiez vos identifiants.');
    }
  };
  
  return (
    <div className="min-h-screen bg-light flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center items-center space-x-3 mb-8">
          <ParrotIcon className="h-12 w-12 text-accent" />
          <div>
            <span className="text-3xl font-bold text-dark">Kasuku</span>
            <span className="block text-sm text-muted-foreground -mt-1">Login</span>
          </div>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-2xl shadow-soft border">
          <h1 className="text-xl font-semibold mb-4 text-center">Connexion Admin</h1>
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};