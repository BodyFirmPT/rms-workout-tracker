import { createContext, useContext, useState, ReactNode } from 'react';

interface EmulatedUser {
  id: string;
  email: string | null;
  full_name: string | null;
  trainer_id: string | null;
  client_id: string | null;
}

interface EmulationContextType {
  emulatedUser: EmulatedUser | null;
  setEmulatedUser: (user: EmulatedUser | null) => void;
  isEmulating: boolean;
}

const EmulationContext = createContext<EmulationContextType | undefined>(undefined);

export const EmulationProvider = ({ children }: { children: ReactNode }) => {
  const [emulatedUser, setEmulatedUser] = useState<EmulatedUser | null>(() => {
    const stored = localStorage.getItem('emulated_user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleSetEmulatedUser = (user: EmulatedUser | null) => {
    if (user) {
      localStorage.setItem('emulated_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('emulated_user');
    }
    setEmulatedUser(user);
  };

  return (
    <EmulationContext.Provider 
      value={{ 
        emulatedUser, 
        setEmulatedUser: handleSetEmulatedUser,
        isEmulating: !!emulatedUser 
      }}
    >
      {children}
    </EmulationContext.Provider>
  );
};

export const useEmulation = () => {
  const context = useContext(EmulationContext);
  if (context === undefined) {
    throw new Error('useEmulation must be used within an EmulationProvider');
  }
  return context;
};
