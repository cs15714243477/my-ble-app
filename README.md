# POWER PARK 蓝牙控制应用

本应用基于 Expo/React Native 构建，用于通过 BLE 控制“动力模块 POWER PARK”。

## 快速开始

1. Install dependencies

   ```bash
   npm install
   ```

2. 启动应用

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

你可以在 `app` 目录开始开发，项目使用基于文件的路由（`expo-router`）。

## 蓝牙与权限
- Android 需要 `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT`；在 Android 10-11 可能需要定位权限。
- iOS 需要在 Info.plist 配置蓝牙使用描述（在裸应用构建中配置）。
- 应用在 `services/BluetoothService.ts` 内处理初始化、扫描、连接、通知订阅与指令发送。

## UUID 与配置
统一配置位于 `constants/config.ts`：

```ts
export const BLE_SERVICE_UUID = '0000FFF0-0000-1000-8000-00805F9B34FB'; // 服务UUID
export const BLE_WRITE_CHAR_UUID = '0000FFF2-0000-1000-8000-00805F9B34FB'; // 写特征
export const BLE_NOTIFY_CHAR_UUID = '0000FFF1-0000-1000-8000-00805F9B34FB'; // 通知特征
export const SCAN_DURATION_MS = 10000; // 扫描时长
export const CONNECT_TIMEOUT_MS = 8000; // 连接超时
export const RECONNECT_RETRY = 2; // 重连次数
export const RECONNECT_DELAY_MS = 1200; // 重连间隔
```

如设备固件 UUID 不同，请修改以上常量即可，无需改动业务代码。

## 指令与数据
- 模式指令：E/N/S/S+/R 映射见 `BluetoothService` 的 `COMMANDS`。
- 转速校准：`7E7F60[速度Hex4位]FBFD`。
- 设备响应监听：优先订阅 `BLE_NOTIFY_CHAR_UUID`，并解析帧头`7E7F`与帧尾`FBFD`。

## 连接策略
- 连接超时：`CONNECT_TIMEOUT_MS`。
- 自动重连：`RECONNECT_RETRY` 次，间隔 `RECONNECT_DELAY_MS`。
- 扫描结束时间：`SCAN_DURATION_MS`，扫描页已读取该配置。

## 已知注意事项
- Base64 转换已改用 `buffer`，避免 `btoa/atob` 在 RN 环境不可用的问题。
- 强烈建议固定目标 Service/Characteristic UUID 以避免误写。

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
