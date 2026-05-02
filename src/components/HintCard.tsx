import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Hint } from '../types';

interface Props {
  hint: Hint;
}

const STRATEGY_COLORS: Record<string, string> = {
  'Naked Single':           '#27ae60', // green
  'Hidden Single (Row)':    '#2980b9', // blue
  'Hidden Single (Column)': '#8e44ad', // purple
  'Hidden Single (Box)':    '#16a085', // teal
  'Naked Pair':             '#d35400', // burnt orange
  'Box-Line Reduction':     '#1abc9c', // mint
  'Trial & Error':          '#c0392b', // red
};

const STRATEGY_ICONS: Record<string, string> = {
  'Naked Single':           '1️⃣',
  'Hidden Single (Row)':    '➡️',
  'Hidden Single (Column)': '⬇️',
  'Hidden Single (Box)':    '🔲',
  'Naked Pair':             '👫',
  'Box-Line Reduction':     '📐',
  'Trial & Error':          '🔬',
};

export default function HintCard({ hint }: Props) {
  const badgeColor = STRATEGY_COLORS[hint.strategy] ?? '#7f8c8d';
  const icon = STRATEGY_ICONS[hint.strategy] ?? '💡';

  return (
    <View style={[styles.card, { borderLeftColor: badgeColor }]}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeIcon}>{icon}</Text>
        <Text style={styles.badgeText}>{hint.strategy}</Text>
      </View>

      <Text style={styles.position}>
        Row {hint.row + 1}, Col {hint.col + 1}{'  →  '}
        <Text style={[styles.value, { color: badgeColor }]}>{hint.value}</Text>
      </Text>

      <Text style={styles.explanation}>{hint.explanation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22', // overridden inline
  },
  badge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    gap: 5,
  },
  badgeIcon: { fontSize: 13 },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  position: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  explanation: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
