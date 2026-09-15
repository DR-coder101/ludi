import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({ visible, message, type = 'info', duration = 3000, onDismiss }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const typeStyles = {
    error: styles.errorToast,
    success: styles.successToast,
    info: styles.infoToast,
  };

  const typeIcons = {
    error: '❌',
    success: '✅',
    info: 'ℹ️',
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        typeStyles[type],
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.icon}>{typeIcons[type]}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  errorToast: {
    backgroundColor: '#4a2020',
    borderColor: '#E53935',
  },
  successToast: {
    backgroundColor: '#1a4a1a',
    borderColor: '#43A047',
  },
  infoToast: {
    backgroundColor: '#2a3a4a',
    borderColor: '#1E88E5',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
