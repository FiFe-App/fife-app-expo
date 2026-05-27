import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Redirect, Slot, usePathname, Link } from 'expo-router';
import { supabase } from '@/lib/supabase/supabase';
import type { Session } from '@supabase/supabase-js';
import { AdminContext } from './lib/context';

const ADMIN_EMAILS = ['kristofakos1229@gmail.com'];

const C = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  muted: '#8b949e',
  accent: '#58a6ff',
  success: '#3fb950',
  error: '#f85149',
};

function getFromSession(key: string) {
  try { return sessionStorage.getItem(key) ?? ''; } catch { return ''; }
}
function saveToSession(key: string, value: string) {
  try { sessionStorage.setItem(key, value); } catch {}
}

function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.reload();
  }

  return (
    <View style={[styles.center, { backgroundColor: C.bg, flex: 1 }]}>
      <View style={[styles.card, { width: 340 }]}>
        <Text style={[styles.title, { marginBottom: 24 }]}>FiFe Admin</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={C.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="Password"
          placeholderTextColor={C.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onSubmitEditing={handleLogin}
        />
        {!!error && <Text style={{ color: C.error, marginTop: 8, fontSize: 13 }}>{error}</Text>}
        <Pressable style={[styles.btn, { marginTop: 16 }]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AdminNav() {
  const pathname = usePathname();
  return (
    <View style={styles.nav}>
      <Text style={styles.navBrand}>⚡ FiFe Admin</Text>
      <Text style={styles.navEnv} numberOfLines={1}>
        {process.env.EXPO_PUBLIC_SUPABASE_URL}
      </Text>
      <View style={styles.navLinks}>
        <Link href="/admin" style={[styles.navLink, pathname === '/admin' && styles.navLinkActive]}>
          <Text style={{ color: pathname === '/admin' ? C.accent : C.muted, fontSize: 14 }}>Tests</Text>
        </Link>
        <Link href="/admin/reports" style={[styles.navLink, pathname === '/admin/reports' && styles.navLinkActive]}>
          <Text style={{ color: pathname === '/admin/reports' ? C.accent : C.muted, fontSize: 14 }}>Reports</Text>
        </Link>
      </View>
      <Pressable onPress={() => { supabase.auth.signOut().then(() => window.location.reload()); }}>
        <Text style={{ color: C.muted, fontSize: 13 }}>Sign out</Text>
      </Pressable>
    </View>
  );
}

export default function AdminLayout() {
  if (Platform.OS !== 'web') return <Redirect href="/" />;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceRoleKey, setServiceRoleKeyState] = useState('');
  const [testEmail, setTestEmailState] = useState('');
  const [testPassword, setTestPasswordState] = useState('');

  useEffect(() => {
    setServiceRoleKeyState(getFromSession('admin_srk'));
    setTestEmailState(getFromSession('admin_test_email'));
    setTestPasswordState(getFromSession('admin_test_password'));
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setSession(res.data.session);
      setLoading(false);
    });
  }, []);

  const setServiceRoleKey = (key: string) => { setServiceRoleKeyState(key); saveToSession('admin_srk', key); };
  const setTestEmail = (e: string) => { setTestEmailState(e); saveToSession('admin_test_email', e); };
  const setTestPassword = (p: string) => { setTestPasswordState(p); saveToSession('admin_test_password', p); };

  if (loading) return <View style={[styles.center, { flex: 1, backgroundColor: C.bg }]}><ActivityIndicator color={C.accent} /></View>;
  if (!session || !ADMIN_EMAILS.includes(session.user.email ?? '')) return <AdminLoginScreen />;

  return (
    <AdminContext.Provider value={{ serviceRoleKey, testEmail, testPassword, setServiceRoleKey, setTestEmail, setTestPassword }}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <AdminNav />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <Slot />
        </ScrollView>
      </View>
    </AdminContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
  },
  title: { color: C.text, fontSize: 22, fontWeight: '700' },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  btn: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: '#0d1117', fontWeight: '700', fontSize: 14 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBrand: { color: C.text, fontSize: 16, fontWeight: '700', marginRight: 8 },
  navEnv: { color: C.muted, fontSize: 11, flex: 1 },
  navLinks: { flexDirection: 'row', gap: 4 },
  navLink: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  navLinkActive: { backgroundColor: '#1c2742' },
});
