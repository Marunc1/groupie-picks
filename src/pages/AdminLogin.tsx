import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

// [NOU] Adresa URL pentru login în PHP
const ADMIN_LOGIN_URL = 'https://pickems.loolishmedia.ro/api.php?action=admin_login';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // [NOU] Stare pentru a dezactiva butonul
  const navigate = useNavigate();

  const handleLogin = async () => { // [MODIFICAT] Funcție asincronă
    if (!password) {
      toast.error('Vă rugăm introduceți parola.');
      return;
    }
    
    setIsLoggingIn(true);

    try {
      // 1. Trimite parola (NU tokenul) către backend
      const response = await fetch(ADMIN_LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password }), // Trimitem parola ca JSON
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 2. Dacă PHP-ul validează parola, acesta returnează un token (securizat)
        localStorage.setItem('admin_token', result.token); // Salvăm tokenul returnat
        toast.success('Acces admin acordat!');
        navigate('/admin');
      } else {
        // 3. Afișează mesajul de eroare returnat de PHP
        toast.error(result.error || 'Parolă incorectă!');
      }

    } catch (error) {
      console.error("Eroare la autentificare:", error);
      toast.error('Eroare de rețea. Verificați conexiunea la server.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Introdu parola pentru a accesa panoul de administrare
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Parolă admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoggingIn && handleLogin()}
              disabled={isLoggingIn} // [NOU]
            />
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoggingIn} // [NOU]
            >
              {isLoggingIn ? 'Se autentifică...' : 'Autentificare'} {/* [NOU] */}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;