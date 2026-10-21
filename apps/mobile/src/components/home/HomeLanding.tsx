import React, { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Leaderboard, LeaderboardScope, TownId } from '@ludi/protocol';
import { color, font } from '../../theme/tokens';
import { antonBold } from '../../theme/antonBold';
import { useLudiFonts } from '../../theme/fonts';
import { Icon, type IconName } from '../game/Icon';
import { PressScale } from './PressScale';
import { cssShadow } from './cssShadow';
import { HomeHero } from './HomeHero';
import {
  leaderboardEmptyCopy,
  onlineLabel,
  TOWN_LABEL,
  TOWN_OPTIONS,
} from '../../home/homeModel';

export interface HomeProfileChip {
  name: string;
  title: string | null;
  level: number;
  initials: string;
}

export interface HomeLandingProps {
  profile: HomeProfileChip;
  streakDays: number | null;
  hasUnread: boolean;
  onlineCount: number;
  ranked: boolean;
  leaderboard: Leaderboard;
  leaderboardTab: LeaderboardScope;
  hometown: TownId | null;
  tournamentNotify: boolean;
  joinOpen?: boolean;
  joinCode?: string;
  settingsOpen?: boolean;
  notesOpen?: boolean;
  creatingRoom?: boolean;
  matching?: boolean;
  notifying?: boolean;
  variant?: 'lobby' | 'ranks';
  insets?: { top: number; bottom: number };
  onCreateRoom: () => void;
  onOpenJoin: () => void;
  onCloseJoin: () => void;
  onJoinCodeChange: (value: string) => void;
  onJoinSubmit: () => void;
  onQuickMatch: () => void;
  onVsBots: () => void;
  onPassAndPlay: () => void;
  onLeaderboardTab: (tab: LeaderboardScope) => void;
  onNotifyTournaments: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onPickHometown: (town: TownId) => void;
  onOpenNotes: () => void;
  onCloseNotes: () => void;
  onLobby: () => void;
  onRanks: () => void;
  children?: ReactNode;
}

const SIDE = 16;

export function HomeLanding(props: HomeLandingProps) {
  const fontsReady = useLudiFonts();
  const device = useSafeAreaInsets();
  const insets = props.insets ?? device;
  const online = onlineLabel(props.onlineCount);
  const podium = podiumSlots(props.leaderboard);
  const emptyCopy = leaderboardEmptyCopy(props.leaderboardTab, props.hometown);

  if (!fontsReady) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        {props.children}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: SIDE,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Hud
          profile={props.profile}
          streakDays={props.streakDays}
          hasUnread={props.hasUnread}
          onNotes={props.onOpenNotes}
          onSettings={props.onOpenSettings}
        />
        {props.variant === 'ranks' ? null : (
          <>
            <HomeHero />
            <FriendsCard busy={props.creatingRoom} onCreate={props.onCreateRoom} onJoin={props.onOpenJoin} />
            <QuickMatchCard
              online={online}
              ranked={props.ranked}
              busy={props.matching}
              onPress={props.onQuickMatch}
            />
            <View style={styles.miniRow}>
              <MiniMode
                icon="robot"
                iconColor="#67E8F9"
                badge="Offline"
                title="VS BOTS"
                sub="3 AI difficulty levels"
                onPress={props.onVsBots}
              />
              <MiniMode
                icon="phone"
                iconColor={color.magenta}
                badge="Party"
                badgeHot
                title="PASS & PLAY"
                sub="One phone, 2–4 players"
                onPress={props.onPassAndPlay}
              />
            </View>
          </>
        )}
        <LeaderboardCard
          tab={props.leaderboardTab}
          onTab={props.onLeaderboardTab}
          podium={podium}
          emptyCopy={emptyCopy}
          you={props.leaderboard.you}
        />
        <TournamentsCard
          notified={props.tournamentNotify}
          busy={props.notifying}
          onNotify={props.onNotifyTournaments}
        />
        <Dock active={props.variant === 'ranks' ? 'ranks' : 'lobby'} onLobby={props.onLobby} onRanks={props.onRanks} />
      </ScrollView>
      <JoinSheet
        open={!!props.joinOpen}
        code={props.joinCode ?? ''}
        onChange={props.onJoinCodeChange}
        onClose={props.onCloseJoin}
        onSubmit={props.onJoinSubmit}
      />
      <SettingsSheet
        open={!!props.settingsOpen}
        hometown={props.hometown}
        onClose={props.onCloseSettings}
        onPick={props.onPickHometown}
      />
      <NotesSheet open={!!props.notesOpen} onClose={props.onCloseNotes} />
      {props.children}
    </View>
  );
}

function Hud({
  profile,
  streakDays,
  hasUnread,
  onNotes,
  onSettings,
}: {
  profile: HomeProfileChip;
  streakDays: number | null;
  hasUnread: boolean;
  onNotes: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.hud}>
      <View style={styles.chip}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{profile.level}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.chipName}>{profile.name}</Text>
          {profile.title ? <Text style={styles.chipTitle}>{profile.title}</Text> : null}
        </View>
      </View>
      <View style={styles.hudActions}>
        {streakDays != null && streakDays > 0 ? (
          <View style={styles.streak}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.streakN}>{streakDays}</Text>
          </View>
        ) : null}
        <RoundIcon label="Notifications" icon="bell" onPress={onNotes} dot={hasUnread} />
        <RoundIcon label="Settings" icon="gear" onPress={onSettings} />
      </View>
    </View>
  );
}

function FriendsCard({
  busy,
  onCreate,
  onJoin,
}: {
  busy?: boolean;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <View style={[styles.friends, cssShadow(0, 12, 28, color.goldArcade, 0.28, 8)]}>
      <View style={styles.friendsHead}>
        <View style={styles.friendsIcon}>
          <Icon name="users" size={22} color={color.goldArcade} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.friendsTitle}>PLAY WITH FRIENDS</Text>
          <Text style={styles.friendsSub}>Make a room, share a code, start in seconds!</Text>
        </View>
      </View>
      <View style={styles.friendsRow}>
        <PressScale label="Create room" busy={busy} onPress={onCreate} containerStyle={{ flex: 1 }} style={styles.darkBtn}>
          {() => (
            <View style={styles.btnInner}>
              <Icon name="plus" size={14} color={color.goldArcade} />
              <Text style={styles.darkBtnText}>CREATE ROOM</Text>
            </View>
          )}
        </PressScale>
        <PressScale label="Join code" onPress={onJoin} containerStyle={{ flex: 1 }} style={styles.goldBtn}>
          {() => (
            <View style={styles.btnInner}>
              <Icon name="key" size={14} color={color.bg} />
              <Text style={styles.goldBtnText}>JOIN CODE</Text>
            </View>
          )}
        </PressScale>
      </View>
    </View>
  );
}

function QuickMatchCard({
  online,
  ranked,
  busy,
  onPress,
}: {
  online: string | null;
  ranked: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale label="Quick match" busy={busy} onPress={onPress} style={styles.quick}>
      {() => (
        <View style={styles.quickInner}>
          <View style={styles.quickIcon}>
            <Icon name="globe" size={22} color={color.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.quickTitleRow}>
              <Text style={styles.quickTitle}>QUICK MATCH</Text>
              <View style={styles.instant}>
                <Icon name="bolt" size={9} color={color.emerald} />
                <Text style={styles.instantText}>INSTANT</Text>
              </View>
            </View>
            <View style={styles.quickMeta}>
              {online ? <Text style={styles.onlineText}>{online}</Text> : null}
              {online && ranked ? <Text style={styles.metaDot}>•</Text> : null}
              {ranked ? <Text style={styles.rankedText}>Ranked</Text> : null}
            </View>
          </View>
          <Icon name="chevron" size={18} color="#6EE7B7" />
        </View>
      )}
    </PressScale>
  );
}

function MiniMode({
  icon,
  iconColor,
  badge,
  badgeHot,
  title,
  sub,
  onPress,
}: {
  icon: IconName;
  iconColor: string;
  badge: string;
  badgeHot?: boolean;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <PressScale label={title} onPress={onPress} containerStyle={{ flex: 1 }} style={styles.mini}>
      {() => (
        <View>
          <View style={styles.miniTop}>
            <View style={styles.miniIcon}>
              <Icon name={icon} size={16} color={iconColor} />
            </View>
            <Text style={[styles.miniBadge, badgeHot ? styles.miniBadgeHot : null]}>{badge}</Text>
          </View>
          <Text style={styles.miniTitle}>{title}</Text>
          <Text style={styles.miniSub}>{sub}</Text>
        </View>
      )}
    </PressScale>
  );
}

function LeaderboardCard({
  tab,
  onTab,
  podium,
  emptyCopy,
  you,
}: {
  tab: LeaderboardScope;
  onTab: (tab: LeaderboardScope) => void;
  podium: Array<Leaderboard['entries'][number] | null>;
  emptyCopy: string;
  you: Leaderboard['you'];
}) {
  const empty = podium.every((slot) => slot == null);
  return (
    <View style={styles.board}>
      <View style={styles.boardHead}>
        <View style={styles.boardLabel}>
          <Icon name="ranking" size={12} color={color.goldArcade} />
          <Text style={styles.boardLabelText}>LEADERBOARDS</Text>
        </View>
        <View style={styles.tabs}>
          <Tab label="Weekly" active={tab === 'weekly'} onPress={() => onTab('weekly')} />
          <Tab label="Town" active={tab === 'town'} onPress={() => onTab('town')} />
        </View>
      </View>
      {empty ? (
        <Text style={styles.empty}>{emptyCopy}</Text>
      ) : (
        <View style={styles.podium}>
          <PodiumSlot entry={podium[1]} place={2} />
          <PodiumSlot entry={podium[0]} place={1} tall />
          <PodiumSlot entry={podium[2]} place={3} />
        </View>
      )}
      {you.entry ? (
        <View style={styles.youRow}>
          <Text style={styles.youRank}>#{you.rank}</Text>
          <View style={styles.youAvatar}>
            <Text style={styles.youInitials}>{you.entry.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.youName}>You</Text>
            <Text style={styles.youTown}>
              {you.entry.hometown ? TOWN_LABEL[you.entry.hometown] : 'No town set'}
            </Text>
          </View>
          <Text style={styles.youPts}>{you.points} this week</Text>
        </View>
      ) : (
        <View style={styles.youRow}>
          <Text style={styles.youName}>You have no finishes this week.</Text>
        </View>
      )}
    </View>
  );
}

function PodiumSlot({
  entry,
  place,
  tall,
}: {
  entry: Leaderboard['entries'][number] | null;
  place: 1 | 2 | 3;
  tall?: boolean;
}) {
  if (!entry) {
    return <View style={styles.podiumCol} />;
  }
  return (
    <View style={styles.podiumCol}>
      {place === 1 ? <Icon name="crown" size={12} color={color.goldArcade} /> : <View style={{ height: 12 }} />}
      <View style={[styles.podiumAvatar, place === 1 ? styles.podiumGold : null]}>
        <Text style={[styles.podiumInit, place === 1 ? { color: color.goldArcade } : { color: color.silver }]}>
          {entry.initials}
        </Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.displayName}
      </Text>
      <Text style={styles.podiumTown} numberOfLines={1}>
        {entry.hometown ? TOWN_LABEL[entry.hometown] : '—'}
      </Text>
      <View style={[styles.podiumBar, tall ? styles.podiumBar1 : place === 2 ? styles.podiumBar2 : styles.podiumBar3]}>
        <Text style={styles.podiumPlace}>{place}</Text>
      </View>
    </View>
  );
}

function TournamentsCard({
  notified,
  busy,
  onNotify,
}: {
  notified: boolean;
  busy?: boolean;
  onNotify: () => void;
}) {
  return (
    <View style={styles.tourney}>
      <View style={styles.boardHead}>
        <View style={styles.boardLabel}>
          <Icon name="trophy" size={12} color={color.goldArcade} />
          <Text style={[styles.boardLabelText, { color: color.goldArcade }]}>TOURNAMENTS</Text>
        </View>
        <Text style={styles.soon}>COMING SOON</Text>
      </View>
      <View style={styles.tourneyRow}>
        <View style={styles.tourneyIcon}>
          <Icon name="crown" size={20} color={color.bg} />
        </View>
        <Text style={styles.tourneyCopy}>Town-vs-town tournaments are coming</Text>
        <PressScale
          label={notified ? 'Notified' : 'Notify me'}
          busy={busy || notified}
          onPress={notified ? undefined : onNotify}
          style={styles.notifyBtn}
        >
          {() => (
            <View style={styles.btnInner}>
              <Icon name="bell" size={12} color={color.bg} />
              <Text style={styles.notifyText}>{notified ? 'NOTIFIED' : 'NOTIFY ME'}</Text>
            </View>
          )}
        </PressScale>
      </View>
    </View>
  );
}

function Dock({
  active,
  onLobby,
  onRanks,
}: {
  active: 'lobby' | 'ranks';
  onLobby: () => void;
  onRanks: () => void;
}) {
  return (
    <View style={styles.dock}>
      <PressScale label="Lobby" onPress={onLobby} style={styles.dockItem}>
        {() => (
          <View style={styles.dockCol}>
            <Icon name="home" size={18} color={active === 'lobby' ? color.goldArcade : color.silver} />
            <Text style={[styles.dockText, active === 'lobby' ? styles.dockOn : null]}>LOBBY</Text>
            {active === 'lobby' ? <View style={styles.dockDot} /> : null}
          </View>
        )}
      </PressScale>
      <PressScale label="Ranks" onPress={onRanks} style={styles.dockItem}>
        {() => (
          <View style={styles.dockCol}>
            <Icon name="ranking" size={18} color={active === 'ranks' ? color.goldArcade : color.silver} />
            <Text style={[styles.dockText, active === 'ranks' ? styles.dockOn : null]}>RANKS</Text>
            {active === 'ranks' ? <View style={styles.dockDot} /> : null}
          </View>
        )}
      </PressScale>
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.tab, active ? styles.tabOn : null]}>
        <Text style={[styles.tabText, active ? styles.tabTextOn : null]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function RoundIcon({
  label,
  icon,
  onPress,
  dot,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  dot?: boolean;
}) {
  return (
    <PressScale label={label} onPress={onPress} style={styles.round}>
      {() => (
        <View>
          <Icon name={icon} size={14} color={color.silver} />
          {dot ? <View style={styles.unread} /> : null}
        </View>
      )}
    </PressScale>
  );
}

function JoinSheet({
  open,
  code,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  code: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>Join with a code</Text>
          <TextInput
            value={code}
            onChangeText={onChange}
            autoCapitalize="characters"
            maxLength={5}
            placeholder="ABC12"
            placeholderTextColor="#6B7280"
            style={styles.input}
            accessibilityLabel="Room code"
          />
          <PressScale label="Join room" onPress={onSubmit} style={styles.goldBtn}>
            {() => (
              <View style={styles.sheetBtn}>
                <Text style={styles.goldBtnText}>JOIN ROOM</Text>
              </View>
            )}
          </PressScale>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SettingsSheet({
  open,
  hometown,
  onClose,
  onPick,
}: {
  open: boolean;
  hometown: TownId | null;
  onClose: () => void;
  onPick: (town: TownId) => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>Home town</Text>
          <Text style={styles.sheetHint}>Pick the parish seat you play for. This is never taken from GPS or IP.</Text>
          {TOWN_OPTIONS.map((town) => (
            <Pressable key={town.id} onPress={() => onPick(town.id)} accessibilityRole="button" accessibilityLabel={town.label}>
              <View style={[styles.townRow, hometown === town.id ? styles.townOn : null]}>
                <Text style={styles.townLabel}>{town.label}</Text>
              </View>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NotesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>Notifications</Text>
          <Text style={styles.sheetHint}>No notifications yet.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function podiumSlots(board: Leaderboard): Array<Leaderboard['entries'][number] | null> {
  const first = board.entries.find((entry) => entry.rank === 1) ?? null;
  const second = board.entries.find((entry) => entry.rank === 2) ?? board.entries.filter((entry) => entry.rank === 1)[1] ?? null;
  const third = board.entries.find((entry) => entry.rank === 3) ?? null;
  return [first, second, third];
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18, 18, 20, 0.9)',
    borderColor: 'rgba(255, 208, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingRight: 14,
    paddingLeft: 6,
  },
  avatarRing: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.bg,
    borderWidth: 2,
    borderColor: color.goldArcade,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.bodyBold,
    color: color.redText,
    fontSize: 12,
  },
  levelBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    backgroundColor: color.goldArcade,
    borderRadius: 8,
    paddingHorizontal: 5,
    minWidth: 18,
    alignItems: 'center',
  },
  levelText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    color: color.bg,
  },
  chipName: {
    fontFamily: font.bodyBold,
    color: color.white,
    fontSize: 14,
  },
  chipTitle: {
    fontFamily: font.bodySemi,
    color: color.goldArcade,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hudActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.surface,
    borderColor: 'rgba(251, 146, 60, 0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  flame: {
    fontSize: 12,
  },
  streakN: {
    fontFamily: font.bodyBold,
    color: color.orange,
    fontSize: 12,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unread: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.red,
  },
  friends: {
    backgroundColor: color.goldArcade,
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFF3A0',
  },
  friendsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  friendsIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsTitle: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 22,
    color: color.bg,
  },
  friendsSub: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: 'rgba(11,11,12,0.75)',
  },
  friendsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  darkBtn: {
    backgroundColor: color.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 208, 0, 0.45)',
  },
  darkBtnText: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 12,
    color: color.goldArcade,
  },
  goldBtn: {
    backgroundColor: '#F5D76E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF8D0',
  },
  goldBtnText: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 12,
    color: color.bg,
  },
  quick: {
    backgroundColor: '#102419',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0, 176, 79, 0.8)',
  },
  quickInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: color.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickTitle: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 18,
    color: color.white,
  },
  instant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 79, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  instantText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    color: color.emerald,
  },
  quickMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  onlineText: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    color: color.emerald,
  },
  metaDot: {
    color: '#6B7280',
  },
  rankedText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: color.goldArcade,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mini: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    minHeight: 108,
  },
  miniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadge: {
    fontFamily: font.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.silver,
    backgroundColor: color.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeHot: {
    color: color.magenta,
    backgroundColor: 'rgba(255, 19, 97, 0.15)',
  },
  miniTitle: {
    marginTop: 12,
    fontFamily: font.display,
    ...antonBold,
    fontSize: 16,
    color: color.white,
  },
  miniSub: {
    marginTop: 2,
    fontFamily: font.body,
    fontSize: 10,
    color: '#9CA3AF',
  },
  board: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  boardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  boardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boardLabelText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: color.silver,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: color.bg,
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tabOn: {
    backgroundColor: color.goldArcade,
  },
  tabText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    color: '#9CA3AF',
  },
  tabTextOn: {
    color: color.bg,
  },
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.bg,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  podiumGold: {
    borderColor: color.goldArcade,
  },
  podiumInit: {
    fontFamily: font.bodyBold,
    fontSize: 12,
  },
  podiumName: {
    marginTop: 4,
    fontFamily: font.bodyBold,
    fontSize: 11,
    color: color.white,
  },
  podiumTown: {
    fontFamily: font.body,
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  podiumBar: {
    width: '100%',
    marginTop: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
  },
  podiumBar1: {
    height: 40,
    borderTopColor: color.goldArcade,
    borderTopWidth: 1,
  },
  podiumBar2: {
    height: 28,
  },
  podiumBar3: {
    height: 20,
  },
  podiumPlace: {
    fontFamily: font.display,
    ...antonBold,
    color: color.goldArcade,
    fontSize: 14,
  },
  youRow: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(228, 32, 46, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youRank: {
    fontFamily: font.display,
    ...antonBold,
    color: color.redText,
    fontSize: 16,
  },
  youAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.redText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youInitials: {
    fontFamily: font.bodyBold,
    color: color.redText,
    fontSize: 10,
  },
  youName: {
    fontFamily: font.bodyBold,
    color: color.white,
    fontSize: 11,
  },
  youTown: {
    fontFamily: font.body,
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  youPts: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    color: color.emerald,
  },
  tourney: {
    backgroundColor: '#18181A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(254, 209, 0, 0.5)',
    padding: 14,
  },
  soon: {
    fontFamily: font.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: color.emerald,
    borderWidth: 1,
    borderColor: 'rgba(0, 165, 64, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tourneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tourneyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: color.goldArcade,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tourneyCopy: {
    flex: 1,
    fontFamily: font.bodyBold,
    fontSize: 12,
    color: color.cream,
  },
  notifyBtn: {
    backgroundColor: '#F5D76E',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  notifyText: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 11,
    color: color.bg,
  },
  dock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(11,11,12,0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
  },
  dockItem: {
    minWidth: 80,
  },
  dockCol: {
    alignItems: 'center',
    gap: 4,
  },
  dockText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  dockOn: {
    color: color.goldArcade,
  },
  dockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.goldArcade,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: color.card,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetTitle: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 22,
    color: color.white,
  },
  sheetHint: {
    fontFamily: font.body,
    fontSize: 13,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: color.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: color.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.bodyBold,
    letterSpacing: 2,
    fontSize: 18,
  },
  sheetBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  townRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: color.surface,
  },
  townOn: {
    borderWidth: 1,
    borderColor: color.goldArcade,
  },
  townLabel: {
    fontFamily: font.bodyBold,
    color: color.white,
    fontSize: 15,
  },
});
