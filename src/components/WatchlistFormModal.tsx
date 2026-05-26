import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WatchlistItem } from '../types';
import { POPULAR_SYMBOLS } from '../utils/mockPrices';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  editing: WatchlistItem | null;
  onClose: () => void;
  onSave: (symbol: string, name: string) => Promise<boolean>;
};

export function WatchlistFormModal({ visible, editing, onClose, onSave }: Props) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSymbol(editing?.symbol ?? '');
      setName(editing?.name ?? '');
      setError('');
    }
  }, [visible, editing]);

  const submit = async () => {
    setSaving(true);
    setError('');
    const ok = await onSave(symbol, name);
    setSaving(false);
    if (ok) onClose();
    else setError(editing ? 'Could not update — symbol may already exist' : 'Symbol already in watchlist');
  };

  const pickPopular = (s: string, n: string) => {
    setSymbol(s);
    setName(n);
    setError('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{editing ? 'Edit symbol' : 'Add to watchlist'}</Text>

          <Text style={styles.label}>Symbol</Text>
          <TextInput
            style={styles.input}
            value={symbol}
            onChangeText={(t) => setSymbol(t.toUpperCase())}
            placeholder="e.g. AAPL"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            editable={!saving}
          />

          <Text style={styles.label}>Name (optional)</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Company name"
            placeholderTextColor={colors.textMuted}
            editable={!saving}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!editing && (
            <>
              <Text style={styles.popularLabel}>Popular picks</Text>
              <FlatList
                data={POPULAR_SYMBOLS}
                keyExtractor={(i) => i.symbol}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.chip}
                    onPress={() => pickPopular(item.symbol, item.name)}
                  >
                    <Text style={styles.chipText}>{item.symbol}</Text>
                  </Pressable>
                )}
              />
            </>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={submit} disabled={saving}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>{editing ? 'Update' : 'Add'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.sell,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  popularLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipsList: {
    maxHeight: 44,
  },
  chip: {
    backgroundColor: colors.primaryDark + '33',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
