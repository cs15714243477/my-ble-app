import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useDialog } from '../../components/DialogProvider';
import { SCAN_DURATION_MS } from '../../constants/config';
import BluetoothService, { BluetoothDevice } from '../../services/BluetoothService';
import { RootState } from '../../store';
import {
  addDevice,
  clearDevices,
  ConnectionStatus,
  setConnectedDevice,
  setConnectionStatus,
  setError,
  setScanning,
} from '../../store/slices/bluetoothSlice';
import {
  resetDeviceState,
  setCurrentMode,
  setCurrentPressure,
  setCurrentSpeed,
  setCurrentVoltage,
  setDeviceConnected,
} from '../../store/slices/deviceSlice';
import { setLoading } from '../../store/slices/uiSlice';

const { width, height } = Dimensions.get('window');

export default function DeviceListScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { 
    devices, 
    isScanning, 
    connectedDevice, 
    connectionStatus,
    isEnabled 
  } = useSelector((state: RootState) => state.bluetooth);
  
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [glowAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isEnabled) {
      initializeBluetooth();
    }

    // 霓虹光晕动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 旋转动画
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const { show } = useDialog();

  const initializeBluetooth = async () => {
    try {
      const initialized = await BluetoothService.initialize();
      if (!initialized) { 
        show({ 
          title: 'Initialization Failed', 
          message: 'Please check Bluetooth permissions and settings', 
          type: 'error' 
        }); 
      }
    } catch (error) {
      console.error('Bluetooth initialization error:', error);
      dispatch(setError('Bluetooth initialization failed'));
    }
  };

  const startScan = async () => {
    try {
      dispatch(clearDevices());
      dispatch(setScanning(true));
      dispatch(setError(null));

      await BluetoothService.startScan((device: BluetoothDevice) => {
        dispatch(addDevice(device));
      });

      // 配置化扫描结束
      setTimeout(() => {
        dispatch(setScanning(false));
      }, SCAN_DURATION_MS);
    } catch (error) {
      console.error('扫描错误:', error);
      dispatch(setError('设备扫描失败'));
      dispatch(setScanning(false));
    }
  };

  const stopScan = () => {
    BluetoothService.stopScan();
    dispatch(setScanning(false));
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      setConnectingDeviceId(device.id);
      dispatch(setConnectionStatus(ConnectionStatus.CONNECTING));
      dispatch(setLoading(true));

      const success = await BluetoothService.connectDevice(device.id);
      
      if (success) {
        // 注册回调
        BluetoothService.setOnModeChangeCallback((mode) => {
          dispatch(setCurrentMode(mode));
        });
        
        BluetoothService.setOnSpeedUpdateCallback((speed) => {
          dispatch(setCurrentSpeed(speed));
        });
        
        BluetoothService.setOnVoltageUpdateCallback((voltage) => {
          dispatch(setCurrentVoltage(voltage));
        });

        BluetoothService.setOnPressureUpdateCallback((pressure) => {
          dispatch(setCurrentPressure(pressure));
        });
        
        const updatedDevice = { ...device, isConnected: true };
        dispatch(setConnectedDevice(updatedDevice));
        dispatch(setDeviceConnected(true));
        dispatch(setConnectionStatus(ConnectionStatus.CONNECTED));
        show({ 
          title: 'Connected', 
          message: `Successfully connected to ${updatedDevice.name || 'device'}`,
          type: 'success'
        });
      } else {
        show({ 
          title: 'Connection Failed', 
          message: 'Unable to connect to device, please retry',
          type: 'error'
        });
        dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
      }
    } catch (error) {
      console.error('Connection error:', error);
      show({ 
        title: 'Connection Failed', 
        message: 'An error occurred during connection',
        type: 'error'
      });
      dispatch(setError('Device connection failed'));
      dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
    } finally {
      setConnectingDeviceId(null);
      dispatch(setLoading(false));
    }
  };

  const disconnectDevice = async () => {
    try {
      console.log('[UI] 开始断开连接流程...');
      dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTING));
      dispatch(setLoading(true));

      // 执行断开连接
      await BluetoothService.disconnectDevice();
      
      console.log('[UI] 蓝牙服务断开完成，更新状态...');
      
      // 批量更新状态，减少重渲染次数
      try {
        dispatch(setConnectedDevice(null));
        dispatch(setDeviceConnected(false));
        dispatch(resetDeviceState());
        dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
        console.log('[UI] 状态更新完成');
      } catch (stateError) {
        console.error('[UI] 状态更新失败:', stateError);
      }
      
      // 延迟显示成功消息，确保状态更新完成
      setTimeout(() => {
        try {
          show({ 
            title: 'Disconnected', 
            message: 'Device disconnected successfully',
            type: 'info'
          });
        } catch (dialogError) {
          console.error('[UI] 显示对话框失败:', dialogError);
        }
      }, 100);
      
    } catch (error) {
      console.error('[UI] Disconnect error:', error);
      try {
        dispatch(setError('Disconnection failed'));
        // 即使失败也要清理状态
        dispatch(setConnectedDevice(null));
        dispatch(setDeviceConnected(false));
        dispatch(resetDeviceState());
        dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
      } catch (cleanupError) {
        console.error('[UI] 清理状态失败:', cleanupError);
      }
    } finally {
      try {
        dispatch(setLoading(false));
        console.log('[UI] 断开连接流程结束');
      } catch (finalError) {
        console.error('[UI] 最终清理失败:', finalError);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await startScan();
    setRefreshing(false);
  };

  const getSignalStrength = (rssi: number): string => {
    if (rssi > -50) return 'EXCELLENT';
    if (rssi > -70) return 'GOOD';
    if (rssi > -90) return 'FAIR';
    return 'WEAK';
  };

  const getSignalColor = (rssi: number): string => {
    if (rssi > -50) return '#00F0FF';
    if (rssi > -70) return '#6B7FFF';
    if (rssi > -90) return '#FF6B9D';
    return '#B84FFF';
  };

  const renderDevice = ({ item }: { item: BluetoothDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceGlass}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={styles.deviceGradient}
        >
          <View style={styles.deviceContent}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>
                {item.name || 'UNKNOWN DEVICE'}
              </Text>
              <Text style={styles.deviceId}>
                ID: {item.id.substring(0, 12)}...
              </Text>
              <View style={styles.signalRow}>
                <View style={[styles.signalDot, { backgroundColor: getSignalColor(item.rssi) }]} />
                <Text style={[styles.signalText, { color: getSignalColor(item.rssi) }]}>
                  {getSignalStrength(item.rssi)} ({item.rssi} dBm)
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.connectBtn,
                connectingDeviceId === item.id && styles.disabled,
              ]}
              onPress={() => connectToDevice(item)}
              disabled={connectingDeviceId === item.id}
              activeOpacity={0.8}
            >
              {connectingDeviceId === item.id ? (
                <ActivityIndicator size="small" color="#00F0FF" />
              ) : (
                <LinearGradient
                  colors={['rgba(0,240,255,0.25)', 'rgba(107,127,255,0.25)']}
                  style={styles.connectBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.connectBtnText}>CONNECT</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {isScanning ? 'SCANNING...' : 'NO DEVICES FOUND'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isScanning ? 'Please wait' : 'Tap scan button to start'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* 深空背景渐变 */}
      <LinearGradient
        colors={['#0a0a1a', '#1a0a2e', '#16213e', '#0a0a1a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* 动态霓虹背景 */}
      <View pointerEvents="none" style={styles.neonBackground}>
        <Animated.View 
          style={[
            styles.neonRing1,
            { 
              transform: [{ rotate: rotateInterpolate }],
              opacity: glowOpacity,
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.neonRing2,
            { 
              transform: [{ rotate: rotateInterpolate }, { scale: 1.2 }],
              opacity: 0.3,
            }
          ]} 
        />
      </View>

      {/* 主内容 */}
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* 顶部栏 */}
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="bluetooth" size={28} color="#00F0FF" style={{ marginRight: 8 }} />
            <Text style={styles.logoText}>DEVICES</Text>
            <View style={styles.logoLine} />
          </View>
          
          <View style={styles.deviceCountBadge}>
            <Text style={styles.deviceCountText}>{devices.length}</Text>
          </View>
        </View>

        {/* 连接状态卡片 */}
        {connectedDevice && (
          <View style={styles.connectedCard}>
            <View style={styles.connectedGlass}>
              <LinearGradient
                colors={['rgba(0,240,255,0.15)', 'rgba(107,127,255,0.1)']}
                style={styles.connectedGradient}
              >
                <View style={styles.connectedContent}>
                  <View style={styles.connectedHeader}>
                    <Text style={styles.connectedLabel}>CONNECTED</Text>
                    <View style={styles.onlineDot} />
                  </View>
                  <Text style={styles.connectedName}>
                    {connectedDevice.name || 'DEVICE'}
                  </Text>
                  <View style={styles.connectedActions}>
                    <TouchableOpacity
                      style={styles.controlBtn}
                      onPress={() => router.push('/explore')}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['rgba(0,240,255,0.25)', 'rgba(107,127,255,0.25)']}
                        style={styles.controlBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.controlBtnText}>→ CONTROL</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.disconnectBtn}
                      onPress={disconnectDevice}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.disconnectBtnText}>DISCONNECT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* 扫描按钮 */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={isScanning ? stopScan : startScan}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isScanning 
              ? ['#FF6B9D', '#FF0080'] 
              : ['rgba(107,127,255,0.3)', 'rgba(107,127,255,0.1)']
            }
            style={styles.scanBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="scan" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.scanBtnText}>
              {isScanning ? 'STOP SCAN' : 'START SCAN'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 设备列表 */}
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          style={styles.deviceList}
          contentContainerStyle={styles.deviceListContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00F0FF']}
              tintColor={'#00F0FF'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ===== 容器 =====
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // ===== 霓虹背景 =====
  neonBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  neonRing1: {
    position: 'absolute',
    top: height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    borderWidth: 2,
    borderColor: '#6B7FFF',
    shadowColor: '#6B7FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  neonRing2: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 1,
    borderColor: '#B84FFF',
    shadowColor: '#B84FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },

  // ===== 顶部栏 =====
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00F0FF',
    letterSpacing: 2,
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logoLine: {
    width: 40,
    height: 2,
    backgroundColor: '#6B7FFF',
    marginLeft: 10,
    shadowColor: '#6B7FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  deviceCountBadge: {
    backgroundColor: 'rgba(107, 127, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6B7FFF',
    shadowColor: '#6B7FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  deviceCountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ===== 连接卡片 =====
  connectedCard: {
    marginBottom: 16,
  },
  connectedGlass: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  connectedGradient: {
    padding: 2,
  },
  connectedContent: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(10, 10, 26, 0.6)',
  },
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  connectedName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  connectedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  controlBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  controlBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  disconnectBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  disconnectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B9D',
    letterSpacing: 1,
  },

  // ===== 扫描按钮 =====
  scanButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6B7FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  scanBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 127, 255, 0.3)',
    borderRadius: 14,
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  // ===== 设备列表 =====
  deviceList: {
    flex: 1,
  },
  deviceListContent: {
    paddingBottom: 100, // 增加底部间距，避免被Tab Bar遮挡
  },
  deviceItem: {
    marginBottom: 12,
  },
  deviceGlass: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  deviceGradient: {
    padding: 1.5,
  },
  deviceContent: {
    flexDirection: 'row',
    alignItems: 'center', // 垂直居中对齐
    padding: 16,
    borderRadius: 14.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 10, 26, 0.6)',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  deviceId: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  connectBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 90,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  connectBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ===== 空列表 =====
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },

  // ===== 通用 =====
  disabled: {
    opacity: 0.4,
  },
});
