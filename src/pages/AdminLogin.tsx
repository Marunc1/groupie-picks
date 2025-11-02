import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simple hash check - pentru securitate reală, folosește Lovable Cloud
    const adminToken = 'EX*QRT2Mc4EvbBDBWKqU'; // Schimbă acest token cu unul propriu
    
    if (password === adminToken) {
      localStorage.setItem('admin_token', btoa(adminToken));
      toast.success('Acces admin acordat!');
      navigate('/admin');
    } else {
      toast.error('Parolă incorectă!');
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
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Autentificare
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
