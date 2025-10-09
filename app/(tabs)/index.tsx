import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

export default function App() {
  const [bleManager] = useState(new BleManager());
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    // 请求蓝牙权限
    requestPermissions();

    return () => {
      bleManager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          Alert.alert('权限被拒绝', '应用需要蓝牙权限才能工作');
        }
      } else {
        // Android 11 及以下
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('权限被拒绝', '应用需要位置权限才能扫描蓝牙设备');
        }
      }
    }
  };

  const scanDevices = () => {
    setDevices([]);
    setScanning(true);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('扫描错误:', error);
        setScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices(prevDevices => {
          // 避免重复添加设备
          if (prevDevices.find(d => d.id === device.id)) {
            return prevDevices;
          }
          return [...prevDevices, device];
        });
      }
    });

    // 10秒后停止扫描
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      bleManager.stopDeviceScan();
      setScanning(false);

      const connected = await device.connect();
      setConnectedDevice(connected);
      
      await connected.discoverAllServicesAndCharacteristics();
      
      Alert.alert('连接成功', `已连接到 ${device.name}`);
      
      // 获取服务信息
      const services = await connected.services();
      console.log('设备服务:', services);
      
    } catch (error) {
      console.error('连接错误:', error);
      Alert.alert('连接失败', error instanceof Error ? error.message : String(error));
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      Alert.alert('已断开连接');
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name || '未命名设备'}</Text>
      <Text style={styles.deviceId}>ID: {item.id}</Text>
      <Text style={styles.rssi}>信号强度: {item.rssi} dBm</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo BLE 示例</Text>
      
      {connectedDevice ? (
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedText}>
            已连接: {connectedDevice.name}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={disconnectDevice}
          >
            <Text style={styles.buttonText}>断开连接</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.button, scanning && styles.buttonDisabled]}
            onPress={scanDevices}
            disabled={scanning}
          >
            <Text style={styles.buttonText}>
              {scanning ? '扫描中...' : '开始扫描'}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={item => item.id}
            style={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {scanning ? '正在搜索设备...' : '点击按钮开始扫描'}
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  rssi: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 50,
    fontSize: 16,
  },
  connectedContainer: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  connectedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
});



