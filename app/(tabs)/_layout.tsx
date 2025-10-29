import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSelector } from 'react-redux';
import { TABBAR_HEIGHT, TABBAR_RADIUS } from '../../constants/config';

import { HapticTab } from '@/components/haptic-tab';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootState } from '../../store';

export default function TabLayout() {
  const { connectedDevice } = useSelector((state: RootState) => state.bluetooth);
  const isConnected = connectedDevice !== null;

  const TabIcon = ({ name, color, focused, showDot }: { name: string; color: string; focused: boolean; showDot?: boolean; }) => {
    const scale = focused ? 1.1 : 1; // 切换态 #
    return (
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }} className="items-center justify-center">
        <Ionicons 
          name={name as any} 
          size={24} 
          color={color}
          style={focused ? { 
            shadowColor: '#00F0FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
          } : undefined}
        />
        {showDot && (
          <View style={{ position: 'absolute', top: -2, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#FF0080', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, shadowColor: '#FF0080', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 }} className="rounded-full">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#00F0FF', // 霓虹青色激活态
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)', // 半透明白色未激活态
          tabBarStyle: {
            backgroundColor: '#0a0a1a', // 完全不透明的深色背景
            borderTopWidth: 1,
            borderTopColor: 'rgba(0, 240, 255, 0.2)', // 霓虹青色边框
            height: TABBAR_HEIGHT,
            paddingBottom: Platform.OS === 'ios' ? 14 : 8,
            paddingTop: 0,
            borderTopLeftRadius: TABBAR_RADIUS,
            borderTopRightRadius: TABBAR_RADIUS,
            overflow: 'hidden',
            shadowColor: '#00F0FF',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 0, // Android 移除阴影
            position: 'absolute', // 设置为绝对定位
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelPosition: 'below-icon',
          tabBarIconStyle: { marginBottom: 0 },
          tabBarItemStyle: { paddingVertical: 6 },
          tabBarLabelStyle: { 
            fontSize: 11, 
            fontWeight: '700',
            letterSpacing: 0.5,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'DEVICES',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'CONTROL',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={isConnected ? (focused ? 'settings' : 'settings-outline') : (focused ? 'warning' : 'warning-outline')} color={isConnected ? color : 'rgba(255, 0, 128, 0.6)'} focused={focused} showDot={!isConnected} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
