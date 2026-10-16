import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SecurityContext = createContext();

const HASH_STORAGE_KEY = 'nexus_vault_master_hash_v2';
const UNLOCKED_SESSION_KEY = 'nexus_vault_is_unlocked_v2';
const FAILED_ATTEMPTS_KEY = 'nexus_security_failed_attempts_v2';
const LOCKOUT_UNTIL_KEY = 'nexus_security_lockout_until_v2';
const AUDIT_LOG_KEY = 'nexus_security_audit_log_v2';

export const MAX_ATTEMPTS = 5;

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

  // --- CYBER DEFENSE & BRUTE FORCE PROTECTION ---
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      return parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  const [securityAuditLogs, setSecurityAuditLogs] = useState(() => {
    try {
      const logs = localStorage.getItem(AUDIT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  });

  // 5-tap mobile secret trigger state
  const tapTimesRef = useRef([]);

  // Helper to append security logs
  const addSecurityLog = (event, details, severity = 'info') => {
    const entry = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      event,
      details,
      severity // 'info', 'warning', 'critical', 'success'
    };
    setSecurityAuditLogs((prev) => {
      const updated = [entry, ...prev.slice(0, 49)]; // keep latest 50 logs
      try {
        localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Live countdown timer for security lockout
  useEffect(() => {
    const updateCountdown = () => {
      const diffMs = lockoutUntil - Date.now();
      if (diffMs > 0) {
        setLockoutSecondsLeft(Math.ceil(diffMs / 1000));
      } else {
        setLockoutSecondsLeft(0);
        if (lockoutUntil > 0) {
          setLockoutUntil(0);
          localStorage.removeItem(LOCKOUT_UNTIL_KEY);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

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
    addSecurityLog('Vault Locked', 'Session locked by administrator.', 'info');
  };

  // Secure unlock with rate limiting & progressive lockout
  const unlockVault = async (enteredPasscode) => {
    // 1. Check if system is currently locked out
    if (lockoutUntil > Date.now()) {
      const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setAuthError(`🚨 CYBER LOCKOUT ACTIVE: Too many failed attempts. Wait ${secs}s.`);
      return false;
    }

    if (!enteredPasscode) {
      setAuthError('Please enter your Secret Passcode.');
      return false;
    }

    const enteredHash = await computeSHA256(enteredPasscode.trim());

    if (enteredHash === passcodeHash) {
      // SUCCESS: Reset all failure counters immediately
      setIsUnlocked(true);
      sessionStorage.setItem(UNLOCKED_SESSION_KEY, 'true');
      setIsSecretModalOpen(false);
      setAuthError('');
      setFailedAttempts(0);
      setLockoutUntil(0);
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_UNTIL_KEY);

      addSecurityLog('Vault Unlocked', 'Master authorization hash verified successfully.', 'success');

      if (pendingAction && typeof pendingAction === 'function') {
        pendingAction();
        setPendingAction(null);
      }
      return true;
    } else {
      // FAILURE: Enforce Progressive Cybersecurity Lockout
      const nextFailCount = failedAttempts + 1;
      setFailedAttempts(nextFailCount);
      localStorage.setItem(FAILED_ATTEMPTS_KEY, String(nextFailCount));

      if (nextFailCount >= MAX_ATTEMPTS) {
        // Critical 5-minute lockdown (300,000 ms)
        const lockDurationMs = 300000;
        const lockTimestamp = Date.now() + lockDurationMs;
        setLockoutUntil(lockTimestamp);
        localStorage.setItem(LOCKOUT_UNTIL_KEY, String(lockTimestamp));

        addSecurityLog(
          'CRITICAL LOCKOUT TRIGGERED',
          `Brute-force defense active: 5 consecutive failed attempts. System locked for 5 minutes.`,
          'critical'
        );
        setAuthError('🚨 Access Blocked: 5 failed attempts. System locked out for 5 minutes.');
      } else if (nextFailCount >= 3) {
        // 30-second security penalty cooldown
        const cooldownTimestamp = Date.now() + 30000;
        setLockoutUntil(cooldownTimestamp);
        localStorage.setItem(LOCKOUT_UNTIL_KEY, String(cooldownTimestamp));

        addSecurityLog(
          'Security Penalty Cooldown',
          `Attempt ${nextFailCount}/5 failed. 30s penalty cooldown imposed.`,
          'warning'
        );
        setAuthError(`⚠️ Invalid Passcode. Cooldown penalty: wait 30s before next attempt.`);
      } else {
        const remaining = MAX_ATTEMPTS - nextFailCount;
        addSecurityLog(
          'Failed Authentication Attempt',
          `Invalid passcode entered. Attempt ${nextFailCount} of ${MAX_ATTEMPTS}.`,
          'warning'
        );
        setAuthError(`Invalid Master Passcode. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      }

      return false;
    }
  };

  const updatePasscode = async (currentPasscode, newPasscode) => {
    const currentHash = await computeSHA256(currentPasscode.trim());
    if (currentHash !== passcodeHash) {
      addSecurityLog('Passcode Update Rejected', 'Current passcode verification failed.', 'warning');
      return { success: false, error: 'Current passcode is incorrect.' };
    }
    if (!newPasscode || newPasscode.length < 6) {
      return { success: false, error: 'New passcode must be at least 6 characters.' };
    }
    const newHash = await computeSHA256(newPasscode.trim());
    setPasscodeHash(newHash);
    localStorage.setItem(HASH_STORAGE_KEY, newHash);
    addSecurityLog('Passcode Changed', 'Master cryptographic hash updated successfully.', 'success');
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
        handleLogoTap,
        // Cyber Defense & Audit values
        failedAttempts,
        maxAttempts: MAX_ATTEMPTS,
        isLockedOut: lockoutSecondsLeft > 0,
        lockoutSecondsLeft,
        securityAuditLogs
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);
