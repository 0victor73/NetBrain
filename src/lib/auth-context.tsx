"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter, usePathname } from "next/navigation";
import { getUserProfile, UserProfile } from "./db";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (uid: string) => {
    const profile = await getUserProfile(uid);
    setUserProfile(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.uid);
        // Salva a foto do Google e nome no Firestore para que outros usuários possam ver nas nets compartilhadas
        import("./db").then(({ saveUserProfile }) => {
          saveUserProfile(currentUser.uid, {
            displayName: currentUser.displayName || "",
            photoURL: currentUser.photoURL || ""
          });
        });
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);

      // Redirecionamento básico
      if (!currentUser && pathname !== "/login") {
        router.push("/login");
      } else if (currentUser && pathname === "/login") {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
