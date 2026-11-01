import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../theme';

/** Full-screen scrollable container used by every demo screen. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Titled section within a screen. */
export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

/** Primary action button. */
export function AppButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Selectable chip row. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            onPress={() => onChange(option)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Labeled text input. */
export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

/** Pretty-printed JSON result block. */
export function JsonBlock({ data }: { data: unknown }) {
  if (data === undefined || data === null) {
    return <Text style={styles.emptyText}>No result yet.</Text>;
  }
  return (
    <View style={styles.code}>
      <Text style={styles.codeText}>{JSON.stringify(data, null, 2)}</Text>
    </View>
  );
}

/** Error message with SDK error code. */
export function ErrorText({ error }: { error?: Error }) {
  if (!error) {
    return null;
  }
  const code =
    'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? ` [${(error as { code: string }).code}]`
      : '';
  return (
    <Text style={styles.errorText}>
      {error.message}
      {code}
    </Text>
  );
}

/** Info or warning callout. */
export function InfoBox({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn';
  children: ReactNode;
}) {
  const palette =
    tone === 'warn'
      ? {
          bg: theme.colors.warnBg,
          border: theme.colors.warnBorder,
          text: theme.colors.warnText,
        }
      : {
          bg: theme.colors.infoBg,
          border: theme.colors.infoBorder,
          text: theme.colors.infoText,
        };
  return (
    <View
      style={[
        styles.infoBox,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.infoText, { color: palette.text }]}>{children}</Text>
    </View>
  );
}

/** Small definition row used for summaries. */
export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.md,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: -theme.spacing.xs,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.chipBg,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextDisabled: {
    color: theme.colors.disabled,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.chipBg,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: theme.colors.chipSelected,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: theme.colors.chipSelectedText,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  code: {
    backgroundColor: theme.colors.codeBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  codeText: {
    fontFamily: theme.font.mono,
    fontSize: 12,
    color: theme.colors.codeText,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
  },
  infoBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
