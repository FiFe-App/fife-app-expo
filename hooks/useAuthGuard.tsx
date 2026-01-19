import { RootState } from "@/redux/store";
import { Redirect } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";

/**
 * Hook to protect routes that require authentication.
 * If user is not authenticated (no uid), returns a Redirect component to the landing page.
 * Otherwise returns null (allowing the page to render).
 * 
 * Usage in a page component:
 * ```tsx
 * export default function MyProtectedPage() {
 *   const authGuard = useAuthGuard();
 *   if (authGuard) return authGuard;
 *   
 *   // Rest of your component code
 *   return <View>...</View>;
 * }
 * ```
 */
export function useAuthGuard(): React.ReactElement | null {
  const { uid } = useSelector((state: RootState) => state.user);
  
  if (!uid) {
    return <Redirect href="/" />;
  }
  
  return null;
}
