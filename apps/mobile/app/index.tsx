import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludi/protocol';
import { hello } from '@ludi/rules';

const SERVER_URL = 'http://localhost:3000';

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL);

    newSocket.on('connect', () => {
      setConnected(true);
      addMessage('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      addMessage('❌ Disconnected from server');
    });

    newSocket.on('pong', (message: string) => {
      addMessage(`📨 ${message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testConnection = () => {
    if (socket?.connected) {
      addMessage('🔄 Testing connection...');
    } else {
      addMessage('⚠️ Not connected');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎲 Ludi</Text>
      <Text style={styles.subtitle}>Caribbean Ludo - Phase 0.1</Text>
      
      <View style={styles.status}>
        <Text style={styles.statusText}>
          Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
        <Text style={styles.rulesText}>
          Rules: {hello()}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Test Connection" onPress={testConnection} disabled={!connected} />
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Connection Log:</Text>
        <ScrollView style={styles.logScroll}>
          {messages.map((msg, i) => (
            <Text key={i} style={styles.logText}>{msg}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  status: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  logContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
