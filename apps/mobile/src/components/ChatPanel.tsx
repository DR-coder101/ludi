/**
 * ChatPanel - Slide-up chat panel for in-game text chat
 */

import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useChatStore, type ChatMessage } from '../stores/chatStore';
import { socketManager } from '../net/socket';
import type { Player } from '@ludi/protocol';

const COLOR_DISPLAY: Record<string, { hex: string }> = {
  red: { hex: '#E53935' },
  green: { hex: '#43A047' },
  yellow: { hex: '#FDD835' },
  blue: { hex: '#1E88E5' },
};

interface ChatPanelProps {
  roomCode: string;
  myPlayerId: string;
  roomPlayers: Player[];
}

export function ChatPanel({ roomCode, myPlayerId, roomPlayers }: ChatPanelProps) {
  const messages = useChatStore((state) => state.messages);
  const isOpen = useChatStore((state) => state.isOpen);
  const unreadCount = useChatStore((state) => state.unreadCount);
  const toggleChat = useChatStore((state) => state.toggleChat);
  const markAllRead = useChatStore((state) => state.markAllRead);

  const [message, setMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    if (isOpen) {
      markAllRead();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOpen, slideAnim, markAllRead]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    socket.emit('chat:send', trimmed);
    setMessage('');
  };

  const getPlayerName = (playerId: string): string => {
    const player = roomPlayers.find((p) => p.id === playerId);
    return player?.displayName || 'Unknown';
  };

  const getPlayerColor = (playerId: string): string => {
    const player = roomPlayers.find((p) => p.id === playerId);
    return player?.color ? COLOR_DISPLAY[player.color]?.hex || '#888' : '#888';
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.playerId === myPlayerId;
    const playerName = getPlayerName(item.playerId);
    const color = getPlayerColor(item.playerId);

    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerMe]}>
        <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
          <View style={styles.messageHeader}>
            <View style={[styles.playerDot, { backgroundColor: color }]} />
            <Text style={styles.playerName}>
              {isMe ? 'You' : playerName}
            </Text>
          </View>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <>
      {/* Chat toggle button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={toggleChat}
      >
        <Text style={styles.chatButtonText}>💬</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Chat panel */}
      <Animated.View
        style={[
          styles.chatPanel,
          {
            transform: [{ translateY }],
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat</Text>
            <TouchableOpacity onPress={toggleChat}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(_, index) => index.toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              if (isOpen) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSend}
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatButtonText: {
    fontSize: 24,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  keyboardAvoid: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  closeButton: {
    fontSize: 24,
    color: '#888',
    paddingHorizontal: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 12,
    maxWidth: '80%',
  },
  messageBubbleMe: {
    backgroundColor: '#4a4a2a',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
