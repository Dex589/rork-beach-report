import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type AdBannerPlaceholderProps = {
  size?: 'banner' | 'large' | 'medium';
};

export default function AdBannerPlaceholder({ size = 'banner' }: AdBannerPlaceholderProps) {
  const height = size === 'banner' ? 50 : size === 'large' ? 90 : 250;
  
  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.text}>AdMob {size === 'banner' ? 'Banner' : size === 'large' ? 'Large Banner' : 'Medium Rectangle'} Placeholder</Text>
      <Text style={styles.subtext}>Replace with actual AdMob component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
