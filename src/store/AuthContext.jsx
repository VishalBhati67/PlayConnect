import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        const existingProfile = snap.exists() ? snap.data() : {};
        const googleName = firebaseUser.displayName?.trim();

        if (!snap.exists()) {
          await setDoc(ref, {
            name: googleName || "New Player",
            email: firebaseUser.email || "",
            phone: firebaseUser.phoneNumber || "",
            photoURL: firebaseUser.photoURL || "",
            role: "player",
            points: 0,
            earnings: 0,
            tier: "Bronze",
            createdAt: new Date().toISOString(),
          });
        } else if (googleName && (!existingProfile.name || existingProfile.name === "New Player")) {
          // Sync the Google account name into the PlayConnect profile.
          await setDoc(ref, {
            name: googleName,
            email: firebaseUser.email || existingProfile.email || "",
            photoURL: firebaseUser.photoURL || existingProfile.photoURL || "",
          }, { merge: true });
        }

        const profile = (await getDoc(ref)).data();
        setUser({ uid: firebaseUser.uid, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);