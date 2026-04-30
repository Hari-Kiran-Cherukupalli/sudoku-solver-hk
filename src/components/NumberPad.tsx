import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onPress: (value: number | null) => void;
}

export default function NumberPad({ onPress }: Props) {
  return (
    <View style={styles.pad}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <TouchableOpacity key={n} style={styles.key} onPress={() => onPress(n)} activeOpacity={0.7}>
          <Text style={styles.keyText}>{n}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.key, styles.clearKey]} onPress={() => onPress(null)} activeOpacity={0.7}>
        <Text style={[styles.keyText, styles.clearText]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  key: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#e3eaf7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  keyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a237e',
  },
  clearKey: {
    backgroundColor: '#fce4ec',
  },
  clearText: {
    color: '#c62828',
  },
});
