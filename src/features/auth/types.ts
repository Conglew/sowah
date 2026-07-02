export type AuthProvider = "google" | "apple";

export type AuthStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "unauthenticated";

export type AuthUser = {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: AuthProvider;
};
