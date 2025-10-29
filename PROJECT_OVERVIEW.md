# 蓝牙动力模块控制应用 - 开发概要

## 项目简介

这是一个基于 React Native 开发的跨平台移动应用，用于通过蓝牙 BLE（低功耗蓝牙）连接和控制动力模块设备。应用提供实时数据监控、设备模式切换、参数校准等功能，并采用现代化科技风格的用户界面。

---

## 主要功能

### 1. 蓝牙设备管理
- **设备扫描**：自动扫描周边蓝牙 BLE 设备
- **设备连接**：支持设备连接/断开，自动重连机制
- **连接状态监控**：实时显示设备连接状态和信号强度
- **权限管理**：自动处理 Android/iOS 蓝牙和定位权限

### 2. 实时数据监控
- **运行模式监控**：实时显示设备当前运行模式（E/N/S/S+/R）
- **转速监控**：实时显示电机转速（RPM）
- **压力监控**：实时显示系统压力，支持 BAR/PSI 单位切换
  - 1 BAR = 14.5037738 PSI
- **数据轮询**：300ms 间隔自动轮询设备数据

### 3. 设备控制
- **模式切换**：支持五种运行模式切换
  - E（经济模式）
  - N（标准模式）
  - S（运动模式）
  - S+（超级运动模式）
  - R（倒车模式）
- **转速校准**：支持手动设置目标转速（0-9999 RPM）
- **实时反馈**：控制指令发送后实时反馈执行结果

### 4. 用户界面
- **科技风格设计**：现代化渐变背景、圆角卡片、阴影效果
- **深色/浅色主题**：自适应系统主题
- **动态效果**：模式显示卡片带脉冲动画
- **响应式布局**：支持不同屏幕尺寸
- **可滚动内容**：防止内容遮挡，提供流畅体验

---

## 主要算法

### 1. 蓝牙通信协议

#### 数据帧格式
```
帧头: 7E 7F
指令码: 2字节
数据域: 可变长度
帧尾: FB FD
```

#### 指令定义
- **模式控制**：`7E7F00FBFD` ~ `7E7F04FBFD`
- **转速校准**：`7E7F61[速度]FBFD`
- **数据请求**：`7E7F50FBFD`
- **模式查询**：`7E7F67FBFD`

### 2. 数据解析算法

#### 综合数据解析（7E7F50 响应）
从数据帧末尾向前解析，每 4 字节为一个数值：

```typescript
// 数据顺序（从末尾开始）
1. 最后4字节：压力值（float，小端序）
2. 中间4字节：转速值（int，小端序）
3. 前面4字节：模式值（int，小端序）
```

**小端序解析示例**：
```typescript
// Int32 解析
value = (byte[3] << 24) | (byte[2] << 16) | (byte[1] << 8) | byte[0]

// Float32 解析
const view = new DataView(new ArrayBuffer(4))
bytes.forEach((byte, i) => view.setUint8(i, byte))
value = view.getFloat32(0, true) // true = 小端序
```

### 3. 粘包拆包算法

蓝牙通知可能发生粘包，需要缓冲区拆包：

```typescript
// 缓冲区累加
buffer += receivedHex

// 循环提取完整帧
while (true) {
  headIndex = buffer.indexOf('7E7F')
  tailIndex = buffer.indexOf('FBFD', headIndex + 4)
  
  if (headIndex < 0 || tailIndex < 0) break
  
  frame = buffer.slice(headIndex, tailIndex + 4)
  buffer = buffer.slice(tailIndex + 4)
  
  parseFrame(frame)
}
```

### 4. 单位换算算法

```typescript
// BAR to PSI
psi = bar × 14.5037738

// PSI to BAR
bar = psi ÷ 14.5037738
```

### 5. 自动重连算法

```typescript
// 带超时的连接重试
for (let i = 0; i <= MAX_RETRY; i++) {
  try {
    device = await Promise.race([
      connectDevice(deviceId),
      timeout(TIMEOUT_MS)
    ])
    if (success) return true
  } catch (e) {
    if (i === MAX_RETRY) break
    await delay(RETRY_DELAY_MS)
  }
}
return false
```

---

## 主要技术栈

### 前端框架
- **React Native 0.76.5**：跨平台移动应用框架
- **Expo SDK**：快速开发工具链
- **TypeScript**：类型安全的 JavaScript 超集

### 状态管理
- **Redux Toolkit**：现代化 Redux 状态管理
- **Redux Slices**：模块化状态管理
  - `bluetoothSlice`：蓝牙连接状态
  - `deviceSlice`：设备数据状态
  - `uiSlice`：UI 主题状态

### 蓝牙通信
- **react-native-ble-plx**：BLE 蓝牙通信库
- **Buffer**：二进制数据处理

### UI/UX 库
- **NativeWind (Tailwind CSS)**：实用优先的样式系统
- **React Native Safe Area Context**：安全区域处理
- **Expo Router**：基于文件的导航系统

### 数据处理
- **Base64 编码/解码**：蓝牙数据传输格式
- **十六进制转换**：数据帧格式转换
- **小端序解析**：二进制数据解析

### 开发工具
- **ESLint**：代码质量检查
- **Metro Bundler**：React Native 打包工具
- **Gradle/Xcode**：原生构建工具

---

## 架构设计

### 1. 分层架构

```
┌─────────────────────────────┐
│     UI Layer (React)        │  ← 用户界面组件
├─────────────────────────────┤
│   State Management (Redux)  │  ← 全局状态管理
├─────────────────────────────┤
│  Service Layer (BLE)        │  ← 蓝牙通信服务
├─────────────────────────────┤
│   Native Modules (BLE-PLX)  │  ← 原生蓝牙接口
└─────────────────────────────┘
```

### 2. 数据流

```
设备 → BLE通知 → 缓冲区拆包 → 数据解析 → Redux更新 → UI刷新
                                              ↓
UI操作 → 发送指令 → HEX编码 → Base64 → BLE写入 → 设备
```

### 3. 核心模块

#### BluetoothService（单例服务）
- 设备扫描与连接
- 特征值发现与订阅
- 数据收发与解析
- 回调函数管理

#### Redux Store
- 蓝牙连接状态
- 设备运行数据
- UI 配置信息

#### UI Components
- 设备列表页（扫描/连接）
- 监控控制页（数据/控制）
- 对话框组件（提示信息）

---

## 性能优化

### 1. 数据轮询优化
- 300ms 间隔轮询，平衡实时性与性能
- 仅在连接状态下轮询
- 断开连接自动停止轮询

### 2. UI 渲染优化
- Redux selector 精确订阅
- React.memo 防止不必要的重渲染
- 虚拟化长列表（设备列表）

### 3. 内存管理
- 缓冲区大小限制（4096 字节上限）
- 及时清理订阅和定时器
- 组件卸载时清理资源

---

## 安全性考虑

### 1. 权限管理
- Android 12+ 蓝牙权限适配
- 运行时权限请求
- 权限拒绝友好提示

### 2. 错误处理
- 连接超时保护
- 指令发送失败重试
- 异常捕获与用户提示

### 3. 数据验证
- 帧格式校验（帧头/帧尾）
- 数据长度检查
- 参数范围验证

---

## 兼容性

- **iOS**：iOS 13.0+
- **Android**：Android 6.0+ (API 23+)
- **蓝牙**：BLE 4.0+

---

## 未来规划

1. **功能扩展**
   - 历史数据记录与图表展示
   - 多设备同时连接
   - 设备配置导入/导出

2. **性能优化**
   - WebSocket 长连接支持
   - 离线数据缓存
   - 更智能的重连策略

3. **用户体验**
   - 设备昵称自定义
   - 快捷操作面板
   - 语音控制支持

---

## 开发团队

- **框架**：React Native + Expo
- **语言**：TypeScript
- **平台**：iOS / Android

---

*最后更新：2025-10-15*

