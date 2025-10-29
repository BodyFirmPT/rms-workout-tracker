import { useEmulation } from '@/contexts/EmulationContext';
import { Button } from './ui/button';
import { AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmulationBanner = () => {
  const { emulatedUser, setEmulatedUser, isEmulating } = useEmulation();
  const navigate = useNavigate();

  if (!isEmulating) return null;

  const handleExit = () => {
    setEmulatedUser(null);
    navigate('/admin');
  };

  return (
    <div className="bg-warning text-warning-foreground px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">
          Emulating user: {emulatedUser?.full_name || emulatedUser?.email || 'Unknown'}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="gap-2 hover:bg-warning-foreground/10"
      >
        <X className="h-4 w-4" />
        Exit Emulation
      </Button>
    </div>
  );
};
