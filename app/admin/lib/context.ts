import { createContext, useContext } from 'react';

export interface AdminContextValue {
  serviceRoleKey: string;
  testEmail: string;
  testPassword: string;
  setServiceRoleKey: (key: string) => void;
  setTestEmail: (email: string) => void;
  setTestPassword: (pass: string) => void;
}

export const AdminContext = createContext<AdminContextValue>({
  serviceRoleKey: '',
  testEmail: '',
  testPassword: '',
  setServiceRoleKey: () => {},
  setTestEmail: () => {},
  setTestPassword: () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}
