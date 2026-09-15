import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@ludi_onboarding_shown';

interface OnboardingTooltipProps {
  onDismiss: () => void;
}

export function OnboardingTooltip({ onDismiss }: OnboardingTooltipProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.tooltipContainer}>
          <Text style={styles.title}>Welcome to Ludi! 🎲</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Goal</Text>
            <Text style={styles.text}>
              Move all 4 of your tokens from your yard to home before your opponents!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎲 Rolling</Text>
            <Text style={styles.text}>
              Tap the dice to roll. You need a 6 to bring a token out of the yard.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🪙 Moving</Text>
            <Text style={styles.text}>
              After rolling, tap a highlighted token to move it. Land on opponents to send them back!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Safe Cells</Text>
            <Text style={styles.text}>
              Tokens on star cells are safe from capture.
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Got it! Let's Play</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const shown = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!shown) {
        setShouldShow(true);
      }
    } catch (err) {
      console.error('Failed to check onboarding:', err);
    } finally {
      setHasChecked(true);
    }
  };

  const dismissOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setShouldShow(false);
    } catch (err) {
      console.error('Failed to save onboarding:', err);
    }
  };

  return { shouldShow: hasChecked && shouldShow, dismissOnboarding };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
