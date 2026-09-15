import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { profileService } from '../src/services/profileService';
import type { UserProfile } from '@ludi/protocol';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, isGuest, upgradeGuestToEmail, signOut } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadProfile();
    } else {
      router.replace('/');
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const data = await profileService.getProfile(userId);
      setProfile(data);
      setDisplayName(data.displayName);
      setAvatarUrl(data.avatarUrl || '');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !displayName.trim()) return;

    try {
      setIsSaving(true);
      setError('');
      
      const updated = await profileService.updateProfile(userId, {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });

      setProfile(updated);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradeEmail.trim() || !upgradePassword.trim()) {
      setError('Please enter email and password');
      return;
    }

    if (upgradePassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsUpgrading(true);
      setError('');

      await upgradeGuestToEmail(upgradeEmail.trim(), upgradePassword);
      
      setShowUpgradeForm(false);
      setUpgradeEmail('');
      setUpgradePassword('');
      
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade account');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>👤 Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {profile.avatarUrl ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.displayName[0].toUpperCase()}</Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.displayName[0].toUpperCase()}</Text>
            </View>
          )}
        </View>

        {editMode ? (
          <>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              placeholder="Your name"
              placeholderTextColor="#888"
            />

            <Text style={styles.label}>Avatar URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor="#888"
              autoCapitalize="none"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => {
                  setEditMode(false);
                  setDisplayName(profile.displayName);
                  setAvatarUrl(profile.avatarUrl || '');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.profileName}>{profile.displayName}</Text>
            {profile.isGuest && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Guest Account</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Type:</Text>
              <Text style={styles.infoValue}>{profile.isGuest ? 'Guest' : 'Email'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setEditMode(true)}>
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            {profile.isGuest && !showUpgradeForm && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => setShowUpgradeForm(true)}
              >
                <Text style={styles.upgradeButtonText}>⬆️ Upgrade to Email Account</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {showUpgradeForm && (
          <View style={styles.upgradeForm}>
            <Text style={styles.upgradeTitle}>Upgrade Account</Text>
            <Text style={styles.upgradeSubtitle}>
              Create an email account to keep your progress across devices
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={upgradeEmail}
              onChangeText={setUpgradeEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={upgradePassword}
              onChangeText={setUpgradePassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#888"
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => {
                  setShowUpgradeForm(false);
                  setUpgradeEmail('');
                  setUpgradePassword('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }, isUpgrading && styles.buttonDisabled]}
                onPress={handleUpgrade}
                disabled={isUpgrading}
              >
                {isUpgrading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.primaryButtonText}>Upgrade</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    color: '#D4AF37',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  badgeText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#D4AF37',
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  upgradeButton: {
    backgroundColor: '#4a2a70',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  upgradeForm: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#4a4a4a',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#4a2020',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
});
