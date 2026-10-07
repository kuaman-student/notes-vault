import React, { createContext, useContext, useState, useEffect } from 'react';

const SecurityContext = createContext();

const PIN_STORAGE_KEY = 'nexus_vault_master_pin';
const UNLOCKED_SESSION_KEY = 'nexus_vault_is_unlocked';
const STEALTH_MODE_KEY = 'nexus_vault_stealth_mode';
const DEFAULT_PIN = '2026';

export function SecurityProvider({ children }) {
  const [masterPin, setMasterPin] = useState(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  });

  const [isUnlocked, setIsUnlocked] = useState(() => {
    // Default unlocked on local dev, but respects locked state
    const saved = sessionStorage.getItem(UNLOCKED_SESSION_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [isStealthMode, setIsStealthMode] = useState(() => {
    return localStorage.getItem(STEALTH_MODE_KEY) === 'true';
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pinError, setPinError] = useState('');

  // Persist unlock state across tabs in this session
  useEffect(() => {
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, String(isUnlocked));
  }, [isUnlocked]);

  const lockVault = () => {
    setIsUnlocked(false);
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, 'false');
  };

  const unlockVault = (enteredPin) => {
    if (enteredPin === masterPin) {
      setIsUnlocked(true);
      sessionStorage.setItem(UNLOCKED_SESSION_KEY, 'true');
      setIsPinModalOpen(false);
      setPinError('');
      if (pendingAction && typeof pendingAction === 'function') {
        pendingAction();
        setPendingAction(null);
      }
      return true;
    } else {
      setPinError('Incorrect Master Passcode. Access denied.');
      return false;
    }
  };

  const updatePin = (oldPin, newPin) => {
    if (oldPin !== masterPin) {
      return { success: false, error: 'Current PIN is incorrect.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 digits.' };
    }
    setMasterPin(newPin);
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    return { success: true };
  };

  const toggleStealthMode = () => {
    const nextVal = !isStealthMode;
    setIsStealthMode(nextVal);
    localStorage.setItem(STEALTH_MODE_KEY, String(nextVal));
    if (nextVal) {
      lockVault();
    }
  };

  // Helper: Guard an action with Master PIN check
  const requireAuth = (action) => {
    if (isUnlocked) {
      action();
    } else {
      setPendingAction(() => action);
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isUnlocked,
        isStealthMode,
        masterPin,
        lockVault,
        unlockVault,
        updatePin,
        toggleStealthMode,
        requireAuth,
        isPinModalOpen,
        setIsPinModalOpen,
        pinError,
        setPinError
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);
