import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DialogAction = { text: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'danger' };
type ToastType = 'success' | 'error' | 'info' | 'warning';
type DialogPayload = { 
  title?: string; 
  message?: string; 
  actions?: DialogAction[];
  type?: ToastType;
  duration?: number; // 自动消失时间（毫秒）
};

type DialogContextType = { show: (p: DialogPayload) => void; hide: () => void };
const DialogContext = createContext<DialogContextType>({ show: () => {}, hide: () => {} });

export const useDialog = () => useContext(DialogContext);

export const DialogProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<DialogPayload>({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [fadeAnim, translateY]);

  const show = useCallback((p: DialogPayload) => { 
    setPayload(p); 
    setVisible(true);
    
    // 动画显示
    Animated.parallel([
      Animated.timing(fadeAnim, {
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
    
    // 自动消失
    const duration = p.duration || 3000;
    setTimeout(() => {
      hide();
    }, duration);
  }, [fadeAnim, translateY, hide]);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  const getToastColor = (type?: ToastType): string => {
    switch (type) {
      case 'success': return '#00F0FF';
      case 'error': return '#FF0080';
      case 'warning': return '#FFB84F';
      case 'info':
      default: return '#6B7FFF';
    }
  };

  const getToastIcon = (type?: ToastType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info':
      default: return 'information-circle';
    }
  };

  if (!visible) {
    return (
      <DialogContext.Provider value={value}>
        {children}
      </DialogContext.Provider>
    );
  }

  const toastColor = getToastColor(payload.type);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {/* Toast 提示 - 顶部显示，不阻塞主要功能 */}
      <Animated.View
        style={[
          styles.toastContainer,
          { 
            top: insets.top + 16,
            opacity: fadeAnim,
            transform: [{ translateY }],
          }
        ]}
      >
        <View style={styles.toastGlass}>
          <LinearGradient
            colors={[`${toastColor}30`, `${toastColor}15`]}
            style={styles.toastGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={[styles.toastBorder, { borderColor: toastColor }]}>
              <View style={styles.toastContent}>
                {/* 图标 */}
                <View style={[styles.iconContainer, { backgroundColor: `${toastColor}20` }]}>
                  <Ionicons 
                    name={getToastIcon(payload.type)} 
                    size={24} 
                    color={toastColor}
                    style={{
                      shadowColor: toastColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 8,
                    }}
                  />
                </View>
                
                {/* 文字内容 */}
                <View style={styles.textContainer}>
                  {!!payload.title && (
                    <Text style={styles.toastTitle}>{payload.title}</Text>
                  )}
                  {!!payload.message && (
                    <Text style={styles.toastMessage}>{payload.message}</Text>
                  )}
                </View>
              </View>
              
              {/* 进度条 */}
              <View style={[styles.progressBar, { backgroundColor: `${toastColor}20` }]}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { backgroundColor: toastColor }
                  ]} 
                />
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </DialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastGlass: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  toastGradient: {
    padding: 1.5,
  },
  toastBorder: {
    borderRadius: 14.5,
    borderWidth: 1.5,
    padding: 14,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
  },
});
