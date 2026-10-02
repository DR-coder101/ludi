import React, { useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { color } from '../../theme/tokens';
import { useLudiFonts } from '../../theme/fonts';
import { ScreenBackdrop } from '../game/ScreenBackdrop';
import { HomeHero, HERO } from './HomeHero';
import { ModeCard, MODE_CARD_HEIGHT } from './ModeCard';
import { AccountStrip } from './AccountStrip';

export interface HomeLandingProps {
  /** Signed in with an email account (guests still see the sign-up prompt). */
  signedIn: boolean;
  onlineBusy?: boolean;
  onOnline: () => void;
  onLocal: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onProfile: () => void;
  onHistory: () => void;
  /** Overrides device safe-area insets (the dev preview simulates an iPhone frame on web). */
  insets?: { top: number; bottom: number };
  children?: ReactNode;
}

const MAX_COLUMN = 440;
const SIDE = 16;
const CARD_GAP = 10;
/** Mockup gaps: hero 3pt under the status bar, account card ends 20pt above the home indicator inset. */
const HERO_TOP = 3;
const BOTTOM_GAP = 20;
/** Two cards, their gaps, and the account strip with two-line copy, as laid out in the mockup. */
const LOWER_ESTIMATE = MODE_CARD_HEIGHT * 2 + CARD_GAP * 2 + 124;

export function HomeLanding(props: HomeLandingProps) {
  const { signedIn, onlineBusy, onOnline, onLocal, onSignIn, onSignUp, onProfile, onHistory, children } = props;
  const fontsReady = useLudiFonts();
  const device = useSafeAreaInsets();
  const insets = props.insets ?? device;
  const { width, height } = useWindowDimensions();

  const columnWidth = Math.min(width, MAX_COLUMN);
  const cardWidth = columnWidth - SIDE * 2;
  const top = insets.top + HERO_TOP;
  const bottom = insets.bottom + BOTTOM_GAP;
  const [lowerHeight, setLowerHeight] = useState(LOWER_ESTIMATE);
  const heroRoom = height - top - bottom - lowerHeight;
  const scale = Math.max(0.5, Math.min(columnWidth / HERO.width, heroRoom / HERO.height));
  const slack = Math.max(0, heroRoom - HERO.height * scale);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScreenBackdrop />
      {fontsReady ? (
        <View style={[styles.column, { width: columnWidth, paddingTop: top, paddingBottom: bottom }]}>
          <View style={styles.heroRoom}>
            <View
              style={{
                position: 'absolute',
                top: slack / 2,
                left: (columnWidth - HERO.width * scale) / 2,
                width: HERO.width * scale,
                height: HERO.height * scale,
              }}
            >
              <View
                style={{
                  transform: [
                    { translateX: (HERO.width * (scale - 1)) / 2 },
                    { translateY: (HERO.height * (scale - 1)) / 2 },
                    { scale },
                  ],
                }}
              >
                <HomeHero />
              </View>
            </View>
          </View>
          <View style={styles.lower} onLayout={(e) => setLowerHeight(e.nativeEvent.layout.height)}>
            <ModeCard
              tone="gold"
              icon="globe"
              title="ONLINE MULTIPLAYER"
              sub="Private rooms · voice & video"
              hint="Create or join a private room"
              width={cardWidth}
              busy={onlineBusy}
              onPress={onOnline}
            />
            <ModeCard
              tone="green"
              icon="phone"
              title="LOCAL PASS & PLAY"
              sub="One phone, 2–4 players"
              hint="Set up a game on this device"
              width={cardWidth}
              onPress={onLocal}
            />
            {signedIn ? (
              <AccountStrip
                lead="You're signed in."
                body="Your wins, stats & friends are saved."
                outline={{ label: 'PROFILE', a11y: 'Profile', onPress: onProfile }}
                solid={{ label: 'HISTORY', a11y: 'Match history', onPress: onHistory }}
              />
            ) : (
              <AccountStrip
                lead="Save your wins."
                body="Create an account to keep your stats & friends."
                outline={{ label: 'SIGN IN', a11y: 'Sign in', onPress: onSignIn }}
                solid={{ label: 'SIGN UP', a11y: 'Sign up', onPress: onSignUp }}
              />
            )}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  heroRoom: {
    flex: 1,
  },
  lower: {
    paddingHorizontal: SIDE,
    gap: CARD_GAP,
  },
});
