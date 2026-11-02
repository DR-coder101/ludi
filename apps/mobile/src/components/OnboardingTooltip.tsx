import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font } from '../theme/tokens';
import {
  getOnboardingController,
  onboardingModalProps,
  rulesModalFrame,
  type OnboardingStorage,
  type RulesInsets,
} from './onboarding';

export const RULES_CLOSE_LABEL = "Got it! Let's Play";

interface OnboardingTooltipProps {
  visible: boolean;
  onDismiss: () => void;
  insets?: RulesInsets;
}

function asyncStorageBound(): OnboardingStorage {
  return {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
  };
}

export function OnboardingTooltip({ visible, onDismiss, insets: insetProp }: OnboardingTooltipProps) {
  const device = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const insets = insetProp ?? device;
  const frame = rulesModalFrame(viewport, insets);
  const modal = onboardingModalProps(visible, onDismiss);

  return (
    <Modal {...modal}>
      <View
        style={[
          styles.overlay,
          { paddingTop: frame.padTop, paddingBottom: frame.padBottom },
        ]}
      >
        <View style={[styles.tooltipContainer, { maxHeight: frame.maxCardHeight, maxWidth: frame.maxCardWidth }]}>
          <ScrollView
            style={[styles.body, Platform.OS === 'web' ? webScrollOutline : null]}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            {...(Platform.OS === 'web' ? { tabIndex: -1 } : null)}
          >
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
                Tap the dice to roll both. A die showing 6 brings a token out of the yard, and any 6 earns another roll.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🪙 Moving</Text>
              <Text style={styles.text}>
                Each die is its own move: tap a die to choose it, then a highlighted token. Land on opponents to send them back!
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⭐ Safe Cells</Text>
              <Text style={styles.text}>
                Tokens on star cells are safe from capture.
              </Text>
            </View>
          </ScrollView>

          <Pressable
            style={styles.button}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={RULES_CLOSE_LABEL}
          >
            <Text style={styles.buttonText}>{RULES_CLOSE_LABEL}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function useOnboarding() {
  const controller = getOnboardingController(asyncStorageBound());
  const [snap, setSnap] = useState(() => controller.snapshot());

  useEffect(() => controller.subscribe(setSnap), [controller]);

  useEffect(() => {
    void controller.hydrate().then(setSnap);
  }, [controller]);

  return {
    shouldShow: snap.visible,
    dismissOnboarding: () => {
      setSnap(controller.dismiss());
    },
    openOnboarding: () => {
      setSnap(controller.open());
    },
  };
}

const webScrollOutline = {
  outlineStyle: 'none',
  outlineWidth: 0,
  outlineColor: 'transparent',
} as ViewStyle;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    flexGrow: 0,
  },
  title: {
    fontFamily: font.bodyBold,
    fontSize: 28,
    lineHeight: 34,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: font.bodyBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#D4AF37',
    marginBottom: 8,
  },
  text: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#ccc',
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
    fontFamily: font.bodyBold,
    fontSize: 18,
    lineHeight: 22,
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
