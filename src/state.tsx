import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, configured, rpc } from "./lib/api";
import { readCart, subtotal } from "./lib/core.mjs";
import { navigate } from "./lib/router";
import type { CartItem, Profile } from "./lib/types";
type State = {
  user: User | null;
  profile: Profile | null;
  authLoading: boolean;
  refreshProfile: () => Promise<void>;
  cart: CartItem[];
  setCart: (items: CartItem[]) => void;
  total: number;
  requireLogin: (path?: string) => boolean;
  logout: () => Promise<void>;
};
const Context = createContext<State>(null!);
const cartKey = "norieco-cart-v1";
export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [authLoading, setAuthLoading] = useState(true);
  const [cart, changeCart] = useState<CartItem[]>(() =>
    readCart(localStorage, cartKey),
  );
  const setCart = (items: CartItem[]) => {
    changeCart(items);
    try {
      localStorage.setItem(cartKey, JSON.stringify(items));
      sessionStorage.removeItem("norieco-checkout-key");
    } catch {
      /* storage may be unavailable */
    }
  };
  const refreshProfile = async () => {
    const p = await rpc<Profile | null>("marketplace_my_profile");
    setProfile(p);
  };
  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        setProfile(null);
        setAuthLoading(false);
      } else
        setTimeout(() => {
          refreshProfile()
            .catch(() => setProfile(null))
            .finally(() => setAuthLoading(false));
        }, 0);
    });
    return () => subscription.unsubscribe();
  }, []);
  const requireLogin = (path = location.pathname + location.search) => {
    if (!user) {
      sessionStorage.setItem("norieco-return", path);
      navigate("/entrar");
      return false;
    }
    if (!profile?.completed_at) {
      sessionStorage.setItem("norieco-return", path);
      navigate("/primeiro-acesso");
      return false;
    }
    return true;
  };
  const logout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    setProfile(null);
    navigate("/");
  };
  return (
    <Context.Provider
      value={{
        user,
        profile,
        authLoading,
        refreshProfile,
        cart,
        setCart,
        total: cart.reduce((s, i) => s + subtotal(i), 0),
        requireLogin,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
