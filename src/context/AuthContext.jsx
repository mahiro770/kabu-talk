import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

// design.md 0-2章：匿名IDの正体 = Firebase Anonymous AuthのUID。
// 初回アクセス時に自動サインインし、ブラウザに永続化される。
const AuthContext = createContext({ uid: null, loading: true, error: null });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ uid: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (cancelled) return;
        if (user) {
          setState({ uid: user.uid, loading: false, error: null });
        } else {
          signInAnonymously(auth).catch((err) => {
            if (!cancelled) {
              setState({ uid: null, loading: false, error: err });
            }
          });
        }
      },
      (err) => {
        if (!cancelled) {
          setState({ uid: null, loading: false, error: err });
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthState() {
  return useContext(AuthContext);
}
