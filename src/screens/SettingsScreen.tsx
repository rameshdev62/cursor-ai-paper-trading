import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing } from '../theme/colors';
import {
  loadApiUrl,
  saveApiUrl,
  loadEquityCsvPath,
  saveEquityCsvPath,
  loadNfoCsvPath,
  saveNfoCsvPath,
  DEFAULT_API_URL,
} from '../utils/storage';
import { setApiBase } from '../utils/api';

export function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('');
  const [equityCsvPath, setEquityCsvPath] = useState('');
  const [nfoCsvPath, setNfoCsvPath] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      loadApiUrl(),
      loadEquityCsvPath(),
      loadNfoCsvPath(),
    ]).then(([api, eq, nfo]) => {
      setApiUrl(api);
      setEquityCsvPath(eq);
      setNfoCsvPath(nfo);
    });
  }, []);

  const handleSave = async () => {
    const trimmedApi = apiUrl.trim();
    if (!trimmedApi) return;
    await Promise.all([
      saveApiUrl(trimmedApi),
      saveEquityCsvPath(equityCsvPath.trim()),
      saveNfoCsvPath(nfoCsvPath.trim()),
    ]);
    setApiBase(trimmedApi);
    setSaved(true);
  };

  const pickFile = async (target: 'equity' | 'nfo') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file) return;
    if (target === 'equity') {
      setEquityCsvPath(file.uri);
    } else {
      setNfoCsvPath(file.uri);
    }
    setSaved(false);
  };

  const handleReset = async () => {
    setApiUrl(DEFAULT_API_URL);
    setEquityCsvPath('');
    setNfoCsvPath('');
    await Promise.all([
      saveApiUrl(DEFAULT_API_URL),
      saveEquityCsvPath(''),
      saveNfoCsvPath(''),
    ]);
    setApiBase(DEFAULT_API_URL);
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.header}
      >
        <Text style={styles.greeting}>Settings</Text>
        <Text style={styles.subtitle}>Configure API connection & symbol catalogs</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>API</Text>
        <Text style={styles.label}>API URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={(text) => { setApiUrl(text); setSaved(false); }}
          placeholder={DEFAULT_API_URL}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Symbol Catalogs</Text>
        <Text style={styles.hint}>
          Leave empty to use the bundled CSV files.
        </Text>

        <Text style={styles.label}>Equity CSV Path</Text>
        <View style={styles.fileRow}>
          <TextInput
            style={styles.fileInput}
            value={equityCsvPath}
            onChangeText={(text) => { setEquityCsvPath(text); setSaved(false); }}
            placeholder="/path/to/NSE_symbols.csv"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.browseBtn} onPress={() => pickFile('equity')}>
            <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
            <Text style={styles.browseText}>Browse</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>NFO CSV Path</Text>
        <View style={styles.fileRow}>
          <TextInput
            style={styles.fileInput}
            value={nfoCsvPath}
            onChangeText={(text) => { setNfoCsvPath(text); setSaved(false); }}
            placeholder="/path/to/NFO_symbols.csv"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.browseBtn} onPress={() => pickFile('nfo')}>
            <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
            <Text style={styles.browseText}>Browse</Text>
          </Pressable>
        </View>

        {saved && (
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.buy} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={18} color={colors.textMuted} />
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  greeting: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  bodyContent: {
    paddingBottom: spacing.xl * 2,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  fileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fileInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'monospace',
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  browseText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  savedText: {
    color: colors.buy,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
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
