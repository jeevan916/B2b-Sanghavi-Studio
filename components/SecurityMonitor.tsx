
import React, { useEffect, useState } from 'react';
import { storeService } from '../services/storeService';
import { ShieldAlert, LogOut } from 'lucide-react';

export const SecurityMonitor: React.FC = () => {
  const [violationDetected, setViolationDetected] = useState(false);
  const user = storeService.getCurrentUser();

  useEffect(() => {
    // Only monitor strictly for customers
    if (!user || user.role === 'admin' || user.role === 'contributor') return;

    const handleViolation = async (type: string) => {
        setViolationDetected(true);
        try {
            await storeService.logEvent('security_block', undefined, user, undefined, undefined);
            await storeService.blockCustomer(user.id);
        } catch (e) {
            console.error("Block failed", e);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
            e.preventDefault();
            handleViolation('screenshot_attempt');
        }
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
    };

    window.addEventListener('keyup', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    // Disable drag start
    window.addEventListener('dragstart', (e) => e.preventDefault());

    return () => {
        window.removeEventListener('keyup', handleKeyDown);
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('copy', handleCopy);
    };
  }, [user]);

  if (violationDetected) {
      return (
          <div className="fixed inset-0 z-[9999] bg-red-950 text-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
              <div className="bg-red-900/50 p-8 rounded-full mb-6 border-4 border-red-500 animate-pulse">
                  <ShieldAlert size={64} className="text-red-500" />
              </div>
              <h1 className="font-serif text-4xl font-bold mb-4 text-red-500">Security Alert</h1>
              <p className="text-xl font-bold mb-2">Screenshot Attempt Detected</p>
              <p className="text-red-300 max-w-md mb-8">
                  Your account has been flagged and temporarily blocked for violating our content protection policy. 
                  This incident has been reported to the administration.
              </p>
              <button 
                onClick={() => storeService.logout()}
                className="bg-white text-red-900 px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-100 transition"
              >
                  <LogOut size={20} /> Acknowledge & Logout
              </button>
          </div>
      );
  }

  return null;
};
