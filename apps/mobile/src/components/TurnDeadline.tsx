/**
 * TurnDeadline - Countdown timer for turn deadline
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TurnDeadlineProps {
  deadline: number; // Unix timestamp in ms
}

export function TurnDeadline({ deadline }: TurnDeadlineProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [deadline]);

  const isUrgent = timeLeft <= 10;

  return (
    <View style={[styles.container, isUrgent && styles.containerUrgent]}>
      <Text style={[styles.text, isUrgent && styles.textUrgent]}>
        ⏱️ {timeLeft}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  containerUrgent: {
    backgroundColor: '#4a2020',
    borderColor: '#E53935',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  textUrgent: {
    color: '#ff6b6b',
  },
});
