import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useDialog } from '../../components/DialogProvider';
import BluetoothService, { DeviceMode } from '../../services/BluetoothService';
import { RootState } from '../../store';
import {
  setBluetoothEnabled,
  setError as setBluetoothError
} from '../../store/slices/bluetoothSlice';
import {
  setControlling,
  setCurrentMode,
  setCurrentSpeed,
  setDeviceError,
  togglePressureUnit
} from '../../store/slices/deviceSlice';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { currentMode, currentSpeed, currentPressure, pressureUnit, isConnected, isControlling } = useSelector(
    (state: RootState) => state.device
  );
  const { connectedDevice, connectionStatus } = useSelector(
    (state: RootState) => state.bluetooth
  );
  const { theme } = useSelector((state: RootState) => state.ui);

  const [speedInput, setSpeedInput] = useState('0');
  const [showSpeedControl, setShowSpeedControl] = useState(true); // 默认展开转速校准
  const [glowAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const { show } = useDialog();

  useEffect(() => {
    initializeBluetooth();

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

  const initializeBluetooth = async () => {
    try {
      const initialized = await BluetoothService.initialize();
      dispatch(setBluetoothEnabled(initialized));
      
      if (!initialized) { 
        show({ 
          title: 'Initialization Failed', 
          message: 'Please check Bluetooth permissions and settings',
          type: 'error'
        }); 
      }
    } catch (error) {
      console.error('Bluetooth initialization error:', error);
      dispatch(setBluetoothError('Bluetooth initialization failed'));
    }
  };

  

  const handleModeChange = async (mode: DeviceMode) => {
    if (!connectedDevice) {
      show({ 
        title: 'Device Not Connected', 
        message: 'Please connect a device first',
        type: 'warning'
      });
      return;
    }

    try {
      dispatch(setControlling(true));
      const success = await BluetoothService.setDeviceMode(mode);
      
      if (success) { 
        dispatch(setCurrentMode(mode)); 
        show({ 
          title: 'Success', 
          message: `Switched to ${getModeDisplayName(mode)} mode`,
          type: 'success'
        }); 
      }
      else { 
        show({ 
          title: 'Failed', 
          message: 'Mode switch failed, please retry',
          type: 'error'
        }); 
      }
    } catch (error) {
      console.error('Mode switch error:', error);
      dispatch(setDeviceError('Mode switch failed'));
    } finally {
      dispatch(setControlling(false));
    }
  };

  const handleSpeedCalibration = async () => {
    if (!connectedDevice) {
      show({ 
        title: 'Device Not Connected', 
        message: 'Please connect a device first',
        type: 'warning'
      });
      return;
    }

    const speed = parseInt(speedInput);
    if (isNaN(speed) || speed < 0 || speed > 9999) { 
      show({ 
        title: 'Input Error', 
        message: 'Speed value must be between 0-9999',
        type: 'warning'
      }); 
      return; 
    }

    try {
      dispatch(setControlling(true));
      const success = await BluetoothService.setDeviceSpeed(speed);
      
      if (success) { 
        dispatch(setCurrentSpeed(speed)); 
        show({ 
          title: 'Calibration Success', 
          message: `Speed set to ${speed}`,
          type: 'success'
        }); 
      }
      else { 
        show({ 
          title: 'Calibration Failed', 
          message: 'Speed calibration failed, please retry',
          type: 'error'
        }); 
      }
    } catch (error) {
      console.error('Speed calibration error:', error);
      dispatch(setDeviceError('Speed calibration failed'));
    } finally {
      dispatch(setControlling(false));
    }
  };

  const getModeDisplayName = (mode: DeviceMode): string => {
    const modeNames = {
      [DeviceMode.E]: 'ECO',
      [DeviceMode.N]: 'NORMAL',
      [DeviceMode.S]: 'SPORT',
      [DeviceMode.S_PLUS]: 'SPORT+',
      [DeviceMode.R]: 'REVERSE',
    };
    return modeNames[mode] || mode;
  };

  const getModeColor = (mode: DeviceMode): string => {
    const colors = {
      [DeviceMode.E]: '#00F0FF', // Cyan - ECO
      [DeviceMode.N]: '#6B7FFF', // Blue - NORMAL
      [DeviceMode.S]: '#FF6B9D', // Pink - SPORT
      [DeviceMode.S_PLUS]: '#FF0080', // Magenta - SPORT+
      [DeviceMode.R]: '#B84FFF', // Purple - REVERSE
    };
    return colors[mode] || '#6B7FFF';
  };

  const ModeIcon = ({ mode, size = 32, color = '#FFFFFF' }: { mode: DeviceMode | null; size?: number; color?: string }) => {
    if (!mode) return <Ionicons name="ellipse-outline" size={size} color={color} />;
    
    const icons = {
      [DeviceMode.E]: <MaterialCommunityIcons name="leaf" size={size} color={color} />,
      [DeviceMode.N]: <Ionicons name="speedometer-outline" size={size} color={color} />,
      [DeviceMode.S]: <Ionicons name="flash" size={size} color={color} />,
      [DeviceMode.S_PLUS]: <Ionicons name="rocket" size={size} color={color} />,
      [DeviceMode.R]: <MaterialCommunityIcons name="backup-restore" size={size} color={color} />,
    };
    return icons[mode] || <Ionicons name="ellipse-outline" size={size} color={color} />;
  };

  const formatPressure = (pressure: number | undefined): string => {
    if (!pressure && pressure !== 0) {
      return '--';
    }
    if (pressureUnit === 'PSI') {
      return (pressure * 14.5037738).toFixed(2);
    }
    return pressure.toFixed(2);
  };

  const handleTogglePressureUnit = () => {
    dispatch(togglePressureUnit());
  };

  const insets = useSafeAreaInsets();

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
        {/* 旋转光环 */}
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
        {/* 光点 */}
        <Animated.View style={[styles.glowDot1, { opacity: glowOpacity }]} />
        <Animated.View style={[styles.glowDot2, { opacity: glowOpacity }]} />
      </View>

      {/* 主内容 */}
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* 顶部状态栏 */}
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <Ionicons name="flash" size={28} color="#00F0FF" style={{ marginRight: 8 }} />
            <Text style={styles.logoText}>POWER</Text>
            <View style={styles.logoLine} />
          </View>
          
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? '#00F0FF' : '#FF0080' }
            ]} />
            <Text style={styles.statusText}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        {/* 中央主显示器 - 模式和核心数据 */}
        <View style={styles.centralDisplay}>
          {/* 玻璃拟态容器 */}
          <View style={styles.glassContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              style={styles.glassGradient}
            >
              {/* 霓虹边框 */}
              <View style={[
                styles.neonBorder,
                currentMode && { 
                  borderColor: getModeColor(currentMode),
                  shadowColor: getModeColor(currentMode),
                }
              ]}>
                {/* 模式显示 */}
                <View style={styles.modeDisplay}>
                  <View style={styles.modeIconContainer}>
                    <ModeIcon 
                      mode={currentMode} 
                      size={36} 
                      color={currentMode ? getModeColor(currentMode) : '#FFFFFF'} 
                    />
                  </View>
                  <Text style={[
                    styles.modeValue,
                    currentMode && { color: getModeColor(currentMode) }
                  ]}>
                    {currentMode ? getModeDisplayName(currentMode) : 'STANDBY'}
                  </Text>
                  <Text style={styles.modeCode}>{currentMode || '---'}</Text>
                </View>

                {/* 数据网格 */}
                <View style={styles.dataGrid}>
                  {/* 转速 */}
                  <View style={styles.dataCell}>
                    <View style={styles.dataCellHeader}>
                      <View style={[styles.dataIndicator, { backgroundColor: '#00F0FF' }]} />
                      <Text style={styles.dataLabel}>SPEED</Text>
                    </View>
                    <Text style={[styles.dataValue, { color: '#00F0FF' }]}>
                      {currentSpeed.toLocaleString()}
                    </Text>
                    <Text style={styles.dataUnit}>RPM</Text>
                    <View style={styles.dataBar}>
                      <View 
                        style={[
                          styles.dataBarFill,
                          { 
                            width: `${Math.min((currentSpeed / 10000) * 100, 100)}%`,
                            backgroundColor: '#00F0FF'
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  {/* 压力 */}
                  <TouchableOpacity 
                    style={styles.dataCell}
                    onPress={handleTogglePressureUnit}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dataCellHeader}>
                      <View style={[styles.dataIndicator, { backgroundColor: '#B84FFF' }]} />
                      <Text style={styles.dataLabel}>PRESSURE</Text>
                    </View>
                    <Text style={[styles.dataValue, { color: '#B84FFF' }]}>
                      {formatPressure(currentPressure)}
                    </Text>
                    <Text style={styles.dataUnit}>{pressureUnit} ⇄</Text>
                    <View style={styles.dataBar}>
                      <View 
                        style={[
                          styles.dataBarFill,
                          { 
                            width: `${Math.min((currentPressure / 10) * 100, 100)}%`,
                            backgroundColor: '#B84FFF'
                          }
                        ]} 
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* 模式选择器 - 两行布局：上3下2 */}
        <View style={styles.modeSelector}>
          <Text style={styles.selectorTitle}>MODE SELECT</Text>
          
          {/* 第一行：E, N, S */}
          <View style={styles.modeRow}>
            {[DeviceMode.E, DeviceMode.N, DeviceMode.S].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeBtn,
                  isControlling && styles.disabled,
                ]}
                onPress={() => handleModeChange(mode)}
                disabled={isControlling || !isConnected}
                activeOpacity={0.8}
              >
                <View style={styles.modeBtnGlass}>
                  <LinearGradient
                    colors={currentMode === mode 
                      ? [getModeColor(mode) + '40', getModeColor(mode) + '20'] 
                      : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                    }
                    style={styles.modeBtnGradient}
                  >
                    <View style={[
                      styles.modeBtnBorder,
                      currentMode === mode && { 
                        borderColor: getModeColor(mode),
                        shadowColor: getModeColor(mode),
                      }
                    ]}>
                      <View style={styles.modeBtnIconContainer}>
                        <ModeIcon 
                          mode={mode} 
                          size={28} 
                          color={currentMode === mode ? getModeColor(mode) : 'rgba(255,255,255,0.7)'} 
                        />
                      </View>
                      <Text style={[
                        styles.modeBtnCode,
                        currentMode === mode && { color: getModeColor(mode) }
                      ]}>
                        {mode}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 第二行：S+, R */}
          <View style={styles.modeRow}>
            {[DeviceMode.S_PLUS, DeviceMode.R].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeBtnWide,
                  isControlling && styles.disabled,
                ]}
                onPress={() => handleModeChange(mode)}
                disabled={isControlling || !isConnected}
                activeOpacity={0.8}
              >
                <View style={styles.modeBtnGlass}>
                  <LinearGradient
                    colors={currentMode === mode 
                      ? [getModeColor(mode) + '40', getModeColor(mode) + '20'] 
                      : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                    }
                    style={styles.modeBtnGradient}
                  >
                    <View style={[
                      styles.modeBtnBorder,
                      currentMode === mode && { 
                        borderColor: getModeColor(mode),
                        shadowColor: getModeColor(mode),
                      }
                    ]}>
                      <View style={styles.modeBtnIconContainer}>
                        <ModeIcon 
                          mode={mode} 
                          size={28} 
                          color={currentMode === mode ? getModeColor(mode) : 'rgba(255,255,255,0.7)'} 
                        />
                      </View>
                      <Text style={[
                        styles.modeBtnCode,
                        currentMode === mode && { color: getModeColor(mode) }
                      ]}>
                        {mode}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 底部控制面板 */}
        <View style={styles.bottomPanel}>
          {/* 速度校准按钮 */}
          <TouchableOpacity
            style={styles.calibrateTrigger}
            onPress={() => setShowSpeedControl(!showSpeedControl)}
            activeOpacity={0.7}
          >
            <View style={styles.triggerGlass}>
              <LinearGradient
                colors={['rgba(107,127,255,0.2)', 'rgba(107,127,255,0.1)']}
                style={styles.triggerGradient}
              >
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.triggerText}>SPEED CALIBRATION</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* 展开的速度校准面板 */}
          {showSpeedControl && (
            <View style={styles.speedPanel}>
              <View style={styles.speedPanelGlass}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                  style={styles.speedPanelGradient}
                >
                  <View style={styles.speedInputArea}>
                    <TextInput
                      style={styles.speedInput}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      value={speedInput}
                      onChangeText={(t) => {
                        const v = t.replace(/\D+/g, '');
                        const n = Math.max(0, Math.min(9999, parseInt(v || '0')));
                        setSpeedInput(String(n));
                      }}
                      maxLength={4}
                      placeholder="0000"
                      placeholderTextColor="#4B5563"
                    />
                    <Text style={styles.speedUnit}>RPM</Text>
                  </View>

                  <View style={styles.speedAdjustButtons}>
                    {[-100, -10, +10, +100].map((delta) => (
                      <TouchableOpacity
                        key={delta}
                        style={styles.speedAdjustBtn}
                        onPress={() => {
                          const newSpeed = Math.max(0, Math.min(9999, parseInt(speedInput || '0') + delta));
                          setSpeedInput(newSpeed.toString());
                        }}
                      >
                        <Text style={styles.speedAdjustText}>
                          {delta > 0 ? `+${delta}` : delta}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.executeBtn, isControlling && styles.disabled]}
                    onPress={handleSpeedCalibration}
                    disabled={isControlling || !isConnected}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#00F0FF', '#6B7FFF']}
                      style={styles.executeBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.executeBtnText}>
                        {isControlling ? 'CALIBRATING...' : 'EXECUTE'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
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
    top: height * 0.,
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
  glowDot1: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  glowDot2: {
    position: 'absolute',
    bottom: height * 0.3,
    right: width * 0.15,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },


  // ===== 中央显示器 =====
  centralDisplay: {
    marginBottom: 10,
  },
  glassContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassGradient: {
    padding: 8,
  },
  neonBorder: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#6B7FFF',
    padding: 12,
    shadowColor: '#6B7FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    backgroundColor: 'rgba(10, 10, 26, 0.6)',
  },
  modeDisplay: {
    alignItems: 'center',
    paddingVertical: 8, // 减少垂直padding，降低高度
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8, // 减少底部间距
  },
  modeIconContainer: {
    marginBottom: 4, // 减少图标间距
  },
  modeValue: {
    fontSize: 24, // 减少字体大小
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 2, // 减少底部间距
    textShadowColor: '#6B7FFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modeCode: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
    letterSpacing: 3,
  },


  // ===== 数据网格 =====
  dataGrid: {
    flexDirection: 'row',
    gap: 10, // 减少单元格间距
  },
  dataCell: {
    flex: 1,
  },
  dataCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // 减少底部间距
  },
  dataIndicator: {
    width: 3,
    height: 10,
    borderRadius: 1.5,
    marginRight: 5,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  dataLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
  },
  dataValue: {
    fontSize: 24, // 减少字体大小
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 1, // 减少底部间距
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  dataUnit: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4, // 减少底部间距
  },
  dataBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  dataBarFill: {
    height: '100%',
    borderRadius: 1.5,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // ===== 模式选择器 =====
  modeSelector: {
    marginBottom: 1,
  },
  selectorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  modeBtn: {
    flex: 1,
  },
  modeBtnWide: {
    flex: 1,
  },
  modeBtnGlass: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeBtnGradient: {
    padding: 1,
  },
  modeBtnBorder: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16, // 增加垂直padding，提高按钮高度
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  modeBtnIconContainer: {
    marginBottom: 1, // 增加图标和文字的间距
  },
  modeBtnCode: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },

  // ===== 底部面板 =====
  bottomPanel: {
    marginTop: 1,
  },
  calibrateTrigger: {
    marginBottom: 0,
  },
  triggerGlass: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  triggerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 127, 255, 0.3)',
    borderRadius: 14,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  // ===== 速度校准面板 =====
  speedPanel: {
    marginTop: 8,
  },
  speedPanelGlass: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  speedPanelGradient: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  speedInputArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 10,
  },
  speedInput: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
    minWidth: 100,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  speedUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
    letterSpacing: 1,
  },
  speedAdjustButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  speedAdjustBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  speedAdjustText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  executeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  executeBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  executeBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  // ===== 通用 =====
  disabled: {
    opacity: 0.4,
  },
});



