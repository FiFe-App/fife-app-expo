import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { createAdminClient } from './lib/adminClient';
import { useAdmin } from './lib/context';

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  text: '#c9d1d9', muted: '#8b949e', accent: '#58a6ff',
  success: '#3fb950', error: '#f85149', warning: '#d29922',
};

const PAGE_SIZE = 25;

const REASON_LABELS: Record<string, string> = {
  terms_violation: 'Terms violation',
  not_trustworthy: 'Not trustworthy',
  illegal_activity: 'Illegal activity',
  other: 'Other',
};

interface Report {
  id: number;
  created_at: string;
  reason: string;
  description: string;
  author: string;
  reported_profile_id: string;
  author_profile: { full_name: string | null; username: string | null } | null;
  reported_profile: { full_name: string | null; username: string | null } | null;
}

export default function ReportsScreen() {
  const { serviceRoleKey, setServiceRoleKey } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyInput, setKeyInput] = useState(serviceRoleKey);

  async function fetchReports(srk: string, p: number) {
    setLoading(true);
    setError('');
    try {
      const admin = createAdminClient(srk);
      const from = p * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: dbErr, count } = await admin
        .from('reports')
        .select(
          `id, created_at, reason, description, author, reported_profile_id,
           author_profile:profiles!reports_author_fkey(full_name, username),
           reported_profile:profiles!reports_reported_profile_id_fkey(full_name, username)`,
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (dbErr) { setError(dbErr.message); return; }
      setReports((data ?? []) as Report[]);
      setTotal(count ?? 0);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  function load() {
    if (!keyInput.trim()) { setError('Service role key required'); return; }
    setServiceRoleKey(keyInput.trim());
    fetchReports(keyInput.trim(), page);
  }

  useEffect(() => {
    if (serviceRoleKey) fetchReports(serviceRoleKey, page);
  }, [page]);

  function profileLabel(p: { full_name: string | null; username: string | null } | null, id: string) {
    if (!p) return id.slice(0, 8) + '…';
    return p.full_name || p.username || id.slice(0, 8) + '…';
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Reports</Text>
        {total > 0 && <Text style={{ color: C.muted, fontSize: 13 }}>{total} total</Text>}
      </View>

      {!serviceRoleKey && (
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={styles.fieldLabel}>Service Role Key required to bypass RLS</Text>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            value={keyInput}
            onChangeText={setKeyInput}
            placeholder="eyJhbGci…"
            placeholderTextColor={C.muted}
            secureTextEntry
            autoCapitalize="none"
          />
          <Pressable style={styles.btn} onPress={load}>
            <Text style={styles.btnText}>Load reports</Text>
          </Pressable>
        </View>
      )}

      {!!error && (
        <View style={[styles.card, { borderColor: C.error, marginBottom: 12 }]}>
          <Text style={{ color: C.error, fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {loading && <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />}

      {!loading && reports.length === 0 && serviceRoleKey && !error && (
        <Text style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No reports found.</Text>
      )}

      {!loading && reports.length > 0 && (
        <>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.colId, styles.headerText]}>#</Text>
              <Text style={[styles.cell, styles.colProfile, styles.headerText]}>Reporter</Text>
              <Text style={[styles.cell, styles.colProfile, styles.headerText]}>Reported</Text>
              <Text style={[styles.cell, styles.colReason, styles.headerText]}>Reason</Text>
              <Text style={[styles.cell, styles.colDesc, styles.headerText]}>Description</Text>
              <Text style={[styles.cell, styles.colDate, styles.headerText]}>Date</Text>
            </View>

            {reports.map((r: Report, i: number) => (
              <View key={r.id} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
                <Text style={[styles.cell, styles.colId, { color: C.muted }]}>{r.id}</Text>
                <Text style={[styles.cell, styles.colProfile]}>{profileLabel(r.author_profile, r.author)}</Text>
                <Text style={[styles.cell, styles.colProfile]}>{profileLabel(r.reported_profile, r.reported_profile_id)}</Text>
                <View style={[styles.cell, styles.colReason]}>
                  <View style={styles.reasonBadge}>
                    <Text style={{ color: C.warning, fontSize: 11, fontWeight: '600' }}>
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cell, styles.colDesc]} numberOfLines={3}>{r.description}</Text>
                <Text style={[styles.cell, styles.colDate, { color: C.muted }]}>
                  {new Date(r.created_at).toLocaleDateString('hu-HU')}
                </Text>
              </View>
            ))}
          </View>

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageBtn, page === 0 && { opacity: 0.3 }]}
                onPress={() => setPage((p: number) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Text style={{ color: C.text }}>← Prev</Text>
              </Pressable>
              <Text style={{ color: C.muted, fontSize: 13 }}>
                Page {page + 1} / {totalPages}
              </Text>
              <Pressable
                style={[styles.pageBtn, page >= totalPages - 1 && { opacity: 0.3 }]}
                onPress={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <Text style={{ color: C.text }}>Next →</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pageTitle: { color: C.text, fontSize: 18, fontWeight: '700', flex: 1 },
  card: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  fieldLabel: { color: C.muted, fontSize: 11, marginBottom: 4, fontWeight: '600' },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 6, color: C.text, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13 },
  btn: { backgroundColor: C.accent, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  btnText: { color: '#0d1117', fontWeight: '700', fontSize: 14 },
  table: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: C.border },
  rowAlt: { backgroundColor: '#0d1117' },
  headerRow: { backgroundColor: '#161b22', borderBottomWidth: 2, borderBottomColor: C.border },
  cell: { color: C.text, fontSize: 13, padding: 10, lineHeight: 18 },
  headerText: { color: C.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  colId: { width: 50 },
  colProfile: { width: 130 },
  colReason: { width: 140, justifyContent: 'center' },
  colDesc: { flex: 1 },
  colDate: { width: 90 },
  reasonBadge: { backgroundColor: '#2a1f00', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 16, marginBottom: 8 },
  pageBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 },
});
