import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Hint } from '../types';

interface Props {
  hint: Hint;
}

const STRATEGY_COLORS: Record<string, string> = {
  'Naked Single': '#27ae60',
  'Hidden Single (Row)': '#2980b9',
  'Hidden Single (Column)': '#8e44ad',
  'Hidden Single (Box)': '#16a085',
  'Advanced Technique': '#c0392b',
};

export default function HintCard({ hint }: Props) {
  const badgeColor = STRATEGY_COLORS[hint.strategy] ?? '#7f8c8d';

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{hint.strategy}</Text>
      </View>
      <Text style={styles.position}>
        Row {hint.row + 1}, Col {hint.col + 1}  →  <Text style={styles.value}>{hint.value}</Text>
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
    borderLeftColor: '#e67e22',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  position: {
    fontSize: 15,
    color: '#555',
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e67e22',
  },
  explanation: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
  },
});
