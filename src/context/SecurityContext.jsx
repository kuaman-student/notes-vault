import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SecurityContext = createContext();

const HASH_STORAGE_KEY = 'nexus_vault_master_hash_v2';
const UNLOCKED_SESSION_KEY = 'nexus_vault_is_unlocked_v2';

// Master cryptographic SHA-256 authorization hash
export const DEFAULT_PASSCODE_HASH = '46a399f4f39798dbc8d9351c157d6d757c19c4b4d1022ec5bbe00b86434b8711';

// Fast native Web Crypto SHA-256 helper
export async function computeSHA256(str) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const buffer = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Web Crypto unavailable, fallback in use', err);
  }
  // Simple fallback hash if crypto.subtle is restricted
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function SecurityProvider({ children }) {
  const [passcodeHash, setPasscodeHash] = useState(() => {
    return localStorage.getItem(HASH_STORAGE_KEY) || DEFAULT_PASSCODE_HASH;
  });

  // Always FALSE by default for security - only true if authenticated in this session
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem(UNLOCKED_SESSION_KEY) === 'true';
  });

  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isAdminStudioOpen, setIsAdminStudioOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authError, setAuthError] = useState('');

  // 5-tap mobile secret trigger state
  const tapTimesRef = useRef([]);

  // Sync session state
  useEffect(() => {
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, String(isUnlocked));
  }, [isUnlocked]);

  // Global Keyboard Secret Trigger: Ctrl + Shift + L (or Cmd + Shift + L)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setAuthError('');
        setIsSecretModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mobile / Touch Secret Trigger: 5 rapid taps on logo within 2 seconds
  const handleLogoTap = () => {
    const now = Date.now();
    // Keep only taps within the last 2000ms
    tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 2000), now];

    if (tapTimesRef.current.length >= 5) {
      tapTimesRef.current = [];
      setAuthError('');
      setIsSecretModalOpen(true);
    }
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setIsAdminStudioOpen(false);
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, 'false');
  };

  const unlockVault = async (enteredPasscode) => {
    if (!enteredPasscode) {
      setAuthError('Please enter your Secret Passcode.');
      return false;
    }

    const enteredHash = await computeSHA256(enteredPasscode.trim());

    if (enteredHash === passcodeHash) {
      setIsUnlocked(true);
      sessionStorage.setItem(UNLOCKED_SESSION_KEY, 'true');
      setIsSecretModalOpen(false);
      setAuthError('');

      if (pendingAction && typeof pendingAction === 'function') {
        pendingAction();
        setPendingAction(null);
      }
      return true;
    } else {
      setAuthError('Access Denied: Invalid Master Passcode.');
      return false;
    }
  };

  const updatePasscode = async (currentPasscode, newPasscode) => {
    const currentHash = await computeSHA256(currentPasscode.trim());
    if (currentHash !== passcodeHash) {
      return { success: false, error: 'Current passcode is incorrect.' };
    }
    if (!newPasscode || newPasscode.length < 6) {
      return { success: false, error: 'New passcode must be at least 6 characters.' };
    }
    const newHash = await computeSHA256(newPasscode.trim());
    setPasscodeHash(newHash);
    localStorage.setItem(HASH_STORAGE_KEY, newHash);
    return { success: true };
  };

  // Guard action: runs if unlocked, else prompts for secret authentication
  const requireAuth = (action) => {
    if (isUnlocked) {
      action();
    } else {
      setPendingAction(() => action);
      setAuthError('');
      setIsSecretModalOpen(true);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isUnlocked,
        lockVault,
        unlockVault,
        updatePasscode,
        requireAuth,
        isSecretModalOpen,
        setIsSecretModalOpen,
        isAdminStudioOpen,
        setIsAdminStudioOpen,
        authError,
        setAuthError,
        handleLogoTap
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);
