import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase/supabase';
import type { Session } from '@supabase/supabase-js';
import { useAdmin } from './lib/context';
import type { TestResult, TestStatus, TestResultMap } from './lib/types';
import {
  testBusinessSearch, testNearestProfiles,
  testCreateBuzinessNoContact, testCreateBuzinessWithContact,
  testRegistration, testLogin,
  type BusinessSearchParams, type NearestProfilesParams,
} from './lib/tests';

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  text: '#c9d1d9', muted: '#8b949e', accent: '#58a6ff',
  success: '#3fb950', error: '#f85149', warning: '#d29922',
};

// ────────────────────────────────────────────────
// Shared UI primitives
// ────────────────────────────────────────────────

function Badge({ status }: { status: TestStatus }) {
  const map: Record<TestStatus, [string, string]> = {
    idle:    ['#8b949e', '#161b22'],
    running: ['#d29922', '#2a1f00'],
    pass:    ['#3fb950', '#0d2617'],
    fail:    ['#f85149', '#2a0a0a'],
  };
  const [color, bg] = map[status];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{status.toUpperCase()}</Text>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, secure }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secure?: boolean;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.numField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, { width: 120 }]}
        value={String(value)}
        onChangeText={(t: string) => { const n = parseFloat(t); if (!isNaN(n)) onChange(n); }}
        placeholderTextColor={C.muted}
        keyboardType="numeric"
      />
    </View>
  );
}

function ResponsePanel({ response, error }: { response?: unknown; error?: string }) {
  const text = error
    ? `Error: ${error}`
    : response !== undefined
    ? JSON.stringify(response, null, 2)
    : '';
  if (!text) return null;
  return (
    <View style={styles.responsePanel}>
      <Text style={{ color: error ? C.error : C.text, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' } as any}>
        {text}
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────
// Business-search result renderer (shows embedding_text)
// ────────────────────────────────────────────────

function BusinessSearchResult({ result }: { result: TestResult }) {
  if (result.status === 'idle' || result.status === 'running') return null;
  if (result.status === 'fail') return <ResponsePanel error={result.error} response={result.response} />;

  const resp = result.response as { embedding_text?: string; results?: unknown[] } | unknown[] | null;
  const embeddingText = resp && !Array.isArray(resp) ? (resp as { embedding_text?: string }).embedding_text : undefined;
  const results = resp && !Array.isArray(resp) ? (resp as { results?: unknown[] }).results : (resp as unknown[]);

  return (
    <View style={{ marginTop: 8, gap: 6 }}>
      {!!embeddingText && (
        <View style={[styles.responsePanel, { borderColor: '#2a3a1a' }]}>
          <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>EMBEDDING TEXT (AI expansion)</Text>
          <Text style={{ color: '#3fb950', fontFamily: 'monospace', fontSize: 12 }}>{embeddingText}</Text>
        </View>
      )}
      <View style={styles.responsePanel}>
        <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>RESULTS ({Array.isArray(results) ? results.length : 0})</Text>
        <Text style={{ color: C.text, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' } as any}>
          {JSON.stringify(results, null, 2)}
        </Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────
// Test card
// ────────────────────────────────────────────────

function TestCard({
  id, title, description, result, onRun, running,
  children,
}: {
  id: string; title: string; description: string;
  result: TestResult; onRun: () => void; running: boolean;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (result.status === 'pass' || result.status === 'fail') setExpanded(true);
  }, [result.status]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Badge status={result.status} />
            {result.durationMs > 0 && (
              <Text style={{ color: C.muted, fontSize: 12 }}>{result.durationMs}ms</Text>
            )}
          </View>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
        <Pressable
          style={[styles.runBtn, running && styles.runBtnDisabled]}
          onPress={onRun}
          disabled={running}
        >
          {running ? <ActivityIndicator color={C.accent} size="small" /> : <Text style={styles.runBtnText}>Run</Text>}
        </Pressable>
      </View>

      {children && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
          {children}
        </View>
      )}

      {(result.status === 'pass' || result.status === 'fail') && (
        <Pressable
          style={{ marginTop: 8 }}
          onPress={() => setExpanded((v: boolean) => !v)}
        >
          <Text style={{ color: C.accent, fontSize: 12 }}>{expanded ? '▲ Hide response' : '▼ Show response'}</Text>
        </Pressable>
      )}

      {expanded && id === 'business-search' && <BusinessSearchResult result={result} />}
      {expanded && id !== 'business-search' && <ResponsePanel response={result.response} error={result.error} />}
    </View>
  );
}

// ────────────────────────────────────────────────
// Setup panel
// ────────────────────────────────────────────────

function SetupPanel() {
  const { serviceRoleKey, testEmail, testPassword, setServiceRoleKey, setTestEmail, setTestPassword } = useAdmin();
  const [open, setOpen] = useState(!serviceRoleKey || !testEmail);

  return (
    <View style={[styles.card, { marginBottom: 20 }]}>
      <Pressable onPress={() => setOpen((v: boolean) => !v)} style={styles.cardHeader}>
        <Text style={styles.cardTitle}>⚙ Setup</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>
          {serviceRoleKey ? '✓ Service key set' : '⚠ Service key missing'} ·{' '}
          {testEmail ? `Test: ${testEmail}` : '⚠ Test account missing'}
        </Text>
        <Text style={{ color: C.accent, fontSize: 13 }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, gap: 4 }}>
          <Field label="Service Role Key" value={serviceRoleKey} onChange={setServiceRoleKey} placeholder="eyJhbGci..." secure />
          <Field label="Test Account Email" value={testEmail} onChange={setTestEmail} placeholder="test@example.com" />
          <Field label="Test Account Password" value={testPassword} onChange={setTestPassword} placeholder="••••••••" secure />
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
            Stored in sessionStorage only — cleared when you close the tab.
          </Text>
        </View>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────
// Main dashboard
// ────────────────────────────────────────────────

const DEFAULT_RESULTS: TestResultMap = {
  'business-search': { status: 'idle', durationMs: 0 },
  'nearest-profiles': { status: 'idle', durationMs: 0 },
  'create-buziness-no-contact': { status: 'idle', durationMs: 0 },
  'create-buziness-with-contact': { status: 'idle', durationMs: 0 },
  'registration': { status: 'idle', durationMs: 0 },
  'login': { status: 'idle', durationMs: 0 },
};

export default function AdminTestDashboard() {
  const { serviceRoleKey, testEmail, testPassword } = useAdmin();
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<TestResultMap>(DEFAULT_RESULTS);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);

  // business-search params
  const [bsParams, setBsParams] = useState<BusinessSearchParams>({ query: 'kávé', lat: 47.4979, long: 19.0402, take: 5, matchThreshold: 0.5 });
  // nearest_profiles params
  const [npParams, setNpParams] = useState<NearestProfilesParams>({ lat: 47.4979, long: 19.0402, distance: 50000, take: 6 });

  useEffect(() => {
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => setSession(res.data.session));
  }, []);

  function setResult(id: string, result: TestResult) {
    setResults((prev: TestResultMap) => ({ ...prev, [id]: result }));
  }

  function setRunningState(id: string, value: boolean) {
    setRunning((prev: Record<string, boolean>) => ({ ...prev, [id]: value }));
  }

  const runTest = useCallback(async (id: string) => {
    if (running[id]) return;
    setRunningState(id, true);
    setResult(id, { status: 'running', durationMs: 0 });
    let result: TestResult;

    try {
      switch (id) {
        case 'business-search':
          if (!session) throw new Error('Not logged in');
          result = await testBusinessSearch(session, bsParams);
          break;
        case 'nearest-profiles':
          result = await testNearestProfiles(supabase, npParams);
          break;
        case 'create-buziness-no-contact':
          if (!testEmail || !testPassword) throw new Error('Test account credentials required');
          result = await testCreateBuzinessNoContact(testEmail, testPassword);
          break;
        case 'create-buziness-with-contact':
          if (!testEmail || !testPassword) throw new Error('Test account credentials required');
          if (!serviceRoleKey) throw new Error('Service role key required');
          result = await testCreateBuzinessWithContact(testEmail, testPassword, serviceRoleKey);
          break;
        case 'registration':
          if (!serviceRoleKey) throw new Error('Service role key required');
          result = await testRegistration(serviceRoleKey);
          break;
        case 'login':
          if (!testEmail || !testPassword) throw new Error('Test account credentials required');
          result = await testLogin(testEmail, testPassword);
          break;
        default:
          result = { status: 'fail', durationMs: 0, error: `Unknown test: ${id}` };
      }
    } catch (e: unknown) {
      result = { status: 'fail', durationMs: 0, error: (e as Error)?.message ?? String(e) };
    }

    setResult(id, result);
    setRunningState(id, false);
  }, [session, serviceRoleKey, testEmail, testPassword, bsParams, npParams, running]);

  async function runAll() {
    setRunningAll(true);
    const ids = Object.keys(DEFAULT_RESULTS);
    for (const id of ids) await runTest(id);
    setRunningAll(false);
  }

  const anyRunning = runningAll || Object.values(running).some(Boolean);

  return (
    <View>
      <SetupPanel />

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Health Tests</Text>
        <Pressable style={[styles.runAllBtn, anyRunning && styles.runBtnDisabled]} onPress={runAll} disabled={anyRunning}>
          {anyRunning
            ? <><ActivityIndicator color="#0d1117" size="small" style={{ marginRight: 6 }} /><Text style={styles.runAllBtnText}>Running…</Text></>
            : <Text style={styles.runAllBtnText}>▶ Run All</Text>
          }
        </Pressable>
      </View>

      {/* business-search */}
      <TestCard id="business-search" title="business-search" description="Hybrid semantic + distance search edge function" result={results['business-search']} onRun={() => runTest('business-search')} running={!!running['business-search']}>
        <View style={{ gap: 8 }}>
          <Field label="Query" value={bsParams.query ?? ''} onChange={(v: string) => setBsParams((p: BusinessSearchParams) => ({ ...p, query: v }))} placeholder="kávé, fodrász…" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <NumField label="Lat" value={bsParams.lat ?? 47.4979} onChange={(v: number) => setBsParams((p: BusinessSearchParams) => ({ ...p, lat: v }))} />
            <NumField label="Long" value={bsParams.long ?? 19.0402} onChange={(v: number) => setBsParams((p: BusinessSearchParams) => ({ ...p, long: v }))} />
            <NumField label="Take" value={bsParams.take ?? 5} onChange={(v: number) => setBsParams((p: BusinessSearchParams) => ({ ...p, take: v }))} />
            <NumField label="Match threshold" value={bsParams.matchThreshold ?? 0.5} onChange={(v: number) => setBsParams((p: BusinessSearchParams) => ({ ...p, matchThreshold: v }))} />
          </View>
          <Text style={{ color: C.muted, fontSize: 11 }}>Edge cases: empty query = browse mode · threshold 0.99 = near-zero results</Text>
        </View>
      </TestCard>

      {/* nearest_profiles */}
      <TestCard id="nearest-profiles" title="nearest_profiles" description="DB RPC: PostGIS distance-ordered profiles" result={results['nearest-profiles']} onRun={() => runTest('nearest-profiles')} running={!!running['nearest-profiles']}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <NumField label="Lat" value={npParams.lat ?? 47.4979} onChange={(v: number) => setNpParams((p: NearestProfilesParams) => ({ ...p, lat: v }))} />
          <NumField label="Long" value={npParams.long ?? 19.0402} onChange={(v: number) => setNpParams((p: NearestProfilesParams) => ({ ...p, long: v }))} />
          <NumField label="Distance (m)" value={npParams.distance ?? 50000} onChange={(v: number) => setNpParams((p: NearestProfilesParams) => ({ ...p, distance: v }))} />
          <NumField label="Take" value={npParams.take ?? 6} onChange={(v: number) => setNpParams((p: NearestProfilesParams) => ({ ...p, take: v }))} />
        </View>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Edge cases: distance=1 → empty · distance=999999 → many results</Text>
      </TestCard>

      {/* create-buziness no contact */}
      <TestCard id="create-buziness-no-contact" title="create-buziness (no contact)" description="Expects HTTP 400 — user has no contacts" result={results['create-buziness-no-contact']} onRun={() => runTest('create-buziness-no-contact')} running={!!running['create-buziness-no-contact']} />

      {/* create-buziness with contact */}
      <TestCard id="create-buziness-with-contact" title="create-buziness (with contact)" description="Adds temp contact → creates buziness → cleans up. Expects 200." result={results['create-buziness-with-contact']} onRun={() => runTest('create-buziness-with-contact')} running={!!running['create-buziness-with-contact']} />

      {/* registration */}
      <TestCard id="registration" title="registration" description="signUp with temp email, then deletes the user" result={results['registration']} onRun={() => runTest('registration')} running={!!running['registration']} />

      {/* login */}
      <TestCard id="login" title="login" description="signInWithPassword with test account" result={results['login']} onRun={() => runTest('login')} running={!!running['login']} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pageTitle: { color: C.text, fontSize: 18, fontWeight: '700', flex: 1 },
  runAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.accent, borderRadius: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  runAllBtnText: { color: '#0d1117', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: C.surface, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  cardDesc: { color: C.muted, fontSize: 12 },
  runBtn: {
    backgroundColor: '#21262d', borderRadius: 6, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 6, minWidth: 60, alignItems: 'center',
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: C.text, fontSize: 13, fontWeight: '600' },
  fieldLabel: { color: C.muted, fontSize: 11, marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, color: C.text, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13,
  },
  numField: { gap: 4 },
  responsePanel: {
    backgroundColor: '#0a0f17', borderRadius: 6, borderWidth: 1,
    borderColor: C.border, padding: 12, marginTop: 6,
    maxHeight: 400, overflow: 'scroll' as any,
  },
});
