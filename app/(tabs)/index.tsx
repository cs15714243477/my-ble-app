import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
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
    requestPermissions();
    return () => {
      bleManager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
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
          if (prevDevices.find(d => d.id === device.id)) {
            return prevDevices;
          }
          return [...prevDevices, device];
        });
      }
    });

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
      
      const services = await connected.services();
      console.log('设备服务:', services);
      
    } catch (error: any) {
      console.error('连接错误:', error);
      Alert.alert('连接失败', error.message);
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
      className="bg-white p-4 rounded-xl mb-3 shadow-md active:opacity-80"
      onPress={() => connectToDevice(item)}
    >
      <Text className="text-lg font-semibold text-gray-800 mb-1">
        {item.name || '未命名设备'}
      </Text>
      <Text className="text-xs text-gray-500 mb-1">
        ID: {item.id}
      </Text>
      <Text className="text-xs text-gray-400">
        信号强度: {item.rssi} dBm
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 px-5 pt-16 bg-gray-50">
      <Text className="text-3xl font-bold mb-6 text-center text-gray-800">
        Expo BLE 示例
      </Text>
      
      {connectedDevice ? (
        <View className="bg-green-500 p-5 rounded-xl mb-5">
          <Text className="text-white text-lg font-semibold mb-4 text-center">
            已连接: {connectedDevice.name}
          </Text>
          <TouchableOpacity
            className="bg-red-500 py-4 rounded-lg active:opacity-80"
            onPress={disconnectDevice}
          >
            <Text className="text-white text-center text-base font-semibold">
              断开连接
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            className={`py-4 rounded-lg mb-5 active:opacity-80 ${
              scanning ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            onPress={scanDevices}
            disabled={scanning}
          >
            <Text className="text-white text-center text-base font-semibold">
              {scanning ? '扫描中...' : '开始扫描'}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-12 text-base">
                {scanning ? '正在搜索设备...' : '点击按钮开始扫描'}
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}



