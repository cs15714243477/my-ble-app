# React Native 蓝牙动力模块控制应用需求文档
## 1. 项目概述

### 1.1 项目背景
基于原微信小程序\"Bluetooth_PARK_v1\"的功能，开发一个跨平台的React Native应用，用于通过蓝牙控制\"动力模块 POWER PARK\"设备。

### 1.2 项目目标
- 支持Android和iOS双平台
- 提供完整的蓝牙设备扫描、连接、控制功能
- 实现设备模式切换和转速控制
- 提供实时状态监控和数据反馈

### 1.3 目标用户
- 使用POWER PARK动力模块的用户
- 需要远程控制设备的操作人员

## 2. 功能需求

### 2.1 核心功能模块

#### 2.1.1 蓝牙连接管理
**功能描述：** 管理蓝牙设备的扫描、连接、断开等操作

**详细需求：**
- 蓝牙适配器初始化和权限管理
- 设备扫描和列表展示
- 设备连接和断开
- 连接状态监控和自动重连
- 信号强度显示（RSSI）
- 设备信息展示（名称、ID、信号强度）

**技术要点：**
- 使用\`react-native-ble-plx\`库
- 支持BLE 4.0+协议
- 处理Android/iOS权限差异
- 实现连接超时和错误处理

#### 2.1.2 设备服务发现
**功能描述：** 发现和管理蓝牙设备的服务和特征值

**详细需求：**
- 自动发现设备服务
- 获取特征值属性（READ/WRITE/NOTIFY）
- 服务列表和特征值展示
- 支持标准蓝牙服务UUID识别

**技术要点：**
- 实现服务发现流程
- 特征值属性解析
- 支持自定义服务UUID映射

#### 2.1.3 设备控制界面
**功能描述：** 提供设备控制操作界面

**详细需求：**
- 模式选择按钮（E、N、S、S+、R）
- 当前模式状态显示
- 转速实时显示
- 转速校准功能
- 指令发送确认

**控制指令：**
\`\`\`
E模式: 7E7F00FBFD
N模式: 7E7F01FBFD  
S模式: 7E7F02FBFD
S+模式: 7E7F03FBFD
R模式: 7E7F04FBFD
转速校准: 7E7F60[转速值]FBFD
\`\`\`

#### 2.1.4 数据通信处理
**功能描述：** 处理设备数据收发和解析

**详细需求：**
- 十六进制数据发送
- 设备返回数据解析
- 转速数据实时更新
- 模式状态同步
- 数据格式转换工具

**数据格式：**
- 发送：十六进制字符串转字节数组
- 接收：字节数组转十六进制字符串
- 转速：4位数字显示（0000-9999）

### 2.2 辅助功能模块

#### 2.2.1 用户界面
**功能描述：** 提供直观易用的用户界面

**详细需求：**
- 现代化UI设计
- 响应式布局
- 深色/浅色主题
- 动画效果
- 状态指示器

#### 2.2.2 设置与配置
**功能描述：** 应用设置和设备配置

**详细需求：**
- 蓝牙权限设置
- 连接参数配置
- 数据保存和恢复
- 应用版本信息
- 帮助文档

#### 2.2.3 错误处理与日志
**功能描述：** 错误处理和操作日志

**详细需求：**
- 蓝牙连接错误处理
- 数据通信错误处理
- 操作日志记录
- 错误信息提示
- 崩溃报告

## 3. 技术架构

### 3.1 技术栈选择

#### 3.1.1 核心框架
- **React Native:** 0.72+
- **TypeScript:** 类型安全
- **React Navigation:** 导航管理
- **React Native Reanimated:** 动画

#### 3.1.2 蓝牙通信
- **react-native-ble-plx:** 蓝牙BLE通信
- **react-native-permissions:** 权限管理
- **@react-native-async-storage/async-storage:** 数据存储

#### 3.1.3 UI组件库
- **React Nativewind:** 基础组件
- **React Native Vector Icons:** 图标
- **React Native Linear Gradient:** 渐变效果

#### 3.1.4 状态管理
- **Redux Toolkit:** 状态管理
- **React Redux:** React集成
- **Redux Persist:** 状态持久化

#### 3.1.5 开发工具
- **ESLint:** 代码检查
- **Prettier:** 代码格式化
- **Flipper:** 调试工具
- **React Native Debugger:** 调试



## 4. 用户界面设计

### 4.1 页面结构

#### 4.1.1 主页面 (Home)
- 应用标题和Logo
- 蓝牙状态指示
- 快速连接按钮
- 设备列表入口
- 设置入口

#### 4.1.2 设备列表页面 (DeviceList)
- 扫描控制按钮
- 设备列表展示
- 设备信息（名称、信号强度、连接状态）
- 连接/断开操作
- 刷新功能

#### 4.1.3 设备控制页面 (DeviceControl)
- 设备信息显示
- 模式选择按钮（E、N、S、S+、R）
- 当前模式状态
- 转速显示和校准
- 连接状态指示
- 返回按钮

#### 4.1.4 设置页面 (Settings)
- 蓝牙权限设置
- 连接参数配置
- 主题设置
- 关于信息
- 帮助文档

### 4.2 交互设计

#### 4.2.1 操作流程
1. 启动应用 → 检查蓝牙权限
2. 扫描设备 → 选择目标设备
3. 连接设备 → 进入控制界面
4. 控制操作 → 实时状态反馈
5. 断开连接 → 返回设备列表

#### 4.2.2 状态反馈
- 连接状态：连接中、已连接、断开
- 操作反馈：成功、失败、超时
- 数据更新：实时转速、模式状态
- 错误提示：权限、连接、通信错误

## 5. 数据流设计

### 5.1 状态管理

#### 5.1.1 Redux Store 结构
\`\`\`typescript
interface RootState {
  bluetooth: {
    isEnabled: boolean;
    isScanning: boolean;
    devices: Device[];
    connectedDevice: Device | null;
    connectionStatus: ConnectionStatus;
  };
  device: {
    currentMode: DeviceMode;
    currentSpeed: number;
    isConnected: boolean;
    lastUpdate: number;
  };
  ui: {
    theme: 'light' | 'dark';
    isLoading: boolean;
    error: string | null;
  };
}
\`\`\`

#### 5.1.2 数据流
\`\`\`
用户操作 → Action → Reducer → Store → Component → UI更新
设备数据 → Service → Action → Reducer → Store → Component → UI更新
\`\`\`

### 5.2 数据持久化

#### 5.2.1 本地存储
- 设备连接历史
- 用户设置
- 应用状态
- 错误日志

#### 5.2.2 数据格式
\`\`\`typescript
interface StoredData {
  devices: Device[];
  settings: AppSettings;
  lastConnectedDevice: string;
  appVersion: string;
}
\`\`\`

## 6. 性能优化

### 6.1 蓝牙通信优化
- 连接池管理
- 数据缓存
- 错误重试
- 超时处理

### 6.2 界面性能优化
- 组件懒加载
- 图片优化
- 动画性能
- 内存管理

### 6.3 电池优化
- 后台连接管理
- 扫描频率控制
- 数据更新频率
- 屏幕常亮控制

## 7. 安全考虑

### 7.1 数据安全
- 蓝牙通信加密
- 设备身份验证
- 数据完整性校验
- 敏感信息保护

### 7.2 权限管理
- 蓝牙权限申请
- 位置权限（Android）
- 权限状态检查
- 权限拒绝处理

## 8. 测试策略

### 8.1 单元测试
- 工具函数测试
- 服务模块测试
- 组件测试
- Redux测试

### 8.2 集成测试
- 蓝牙通信测试
- 设备连接测试
- 数据流测试
- 错误处理测试

### 8.3 端到端测试
- 用户操作流程测试
- 设备兼容性测试
- 性能测试
- 稳定性测试

## 9. 部署与发布

### 9.1 开发环境
- React Native CLI
- Android Studio
- Xcode
- 真机测试设备

### 9.2 构建配置
- Android APK构建
- iOS IPA构建
- 代码签名
- 版本管理

### 9.3 发布渠道
- Google Play Store
- Apple App Store
- 企业内部分发
- 测试版本分发

## 10. 维护与更新

### 10.1 版本管理
- 语义化版本号
- 更新日志
- 兼容性检查
- 回滚策略

### 10.2 监控与分析
- 崩溃报告
- 性能监控
- 用户行为分析
- 错误统计

### 10.3 用户支持
- 帮助文档
- 常见问题
- 技术支持
- 用户反馈

## 11. 项目时间线

### 11.1 开发阶段
- **阶段1 (2周):** 项目初始化和基础架构
- **阶段2 (3周):** 蓝牙通信模块开发
- **阶段3 (2周):** 设备控制界面开发
- **阶段4 (2周):** 数据通信和状态管理
- **阶段5 (2周):** UI优化和测试
- **阶段6 (1周):** 发布准备和部署

### 11.2 里程碑
- **M1:** 基础架构完成
- **M2:** 蓝牙通信功能完成
- **M3:** 设备控制功能完成
- **M4:** 完整功能测试通过
- **M5:** 应用发布就绪

## 12. 风险评估

### 12.1 技术风险
- 蓝牙兼容性问题
- 平台差异处理
- 性能优化挑战
- 第三方库依赖

### 12.2 项目风险
- 开发时间估算
- 测试设备获取
- 用户需求变更
- 技术难点解决

### 12.3 风险缓解
- 技术预研和验证
- 原型开发和测试
- 分阶段交付
- 备选方案准备

## 13. 详细功能规格

### 13.1 蓝牙通信协议

#### 13.1.1 设备连接流程
1. **初始化阶段**
   - 检查蓝牙权限
   - 初始化蓝牙适配器
   - 设置连接参数

2. **扫描阶段**
   - 开始设备扫描
   - 过滤目标设备
   - 显示设备列表

3. **连接阶段**
   - 选择目标设备
   - 建立BLE连接
   - 发现服务和特征值

4. **通信阶段**
   - 订阅特征值通知
   - 发送控制指令
   - 接收设备反馈

#### 13.1.2 数据格式规范
\`\`\`typescript
// 发送指令格式
interface Command {
  header: string;    // 7E7F
  command: string;   // 00-04 (模式) 或 60 (转速)
  data: string;      // 转速值 (4字节十六进制)
  footer: string;    // FBFD
}

// 接收数据格式
interface Response {
  header: string;    // 7E7F
  status: string;    // 67 (状态确认)
  data: string;      // 状态数据
  footer: string;    // FBFD
}
\`\`\`

### 13.2 设备控制指令

#### 13.2.1 模式控制指令
| 模式 | 指令 | 描述 |
|------|------|------|
| E | 7E7F00FBFD | 经济模式 |
| N | 7E7F01FBFD | 标准模式 |
| S | 7E7F02FBFD | 运动模式 |
| S+ | 7E7F03FBFD | 超级运动模式 |
| R | 7E7F04FBFD | 倒车模式 |

#### 13.2.2 转速校准指令
- **格式:** 7E7F60[转速值]FBFD
- **转速值:** 4字节十六进制，范围0000-9999
- **示例:** 7E7F600000FBFD (转速为0)

#### 13.2.3 状态反馈指令
| 状态 | 指令 | 描述 |
|------|------|------|
| E确认 | 7E7F670000FBFD | 经济模式确认 |
| N确认 | 7E7F67015EFBFD | 标准模式确认 |
| S确认 | 7E7F6702BCFBFD | 运动模式确认 |
| S+确认 | 7E7F6703E2FBFD | 超级运动模式确认 |
| R确认 | 7E7F670461FBFD | 倒车模式确认 |
| 转速数据 | 7E7F60[转速]FBFD | 当前转速值 |

### 13.3 用户界面详细规格

#### 13.3.1 主页面设计
\`\`\`typescript
interface HomeScreenProps {
  bluetoothStatus: 'enabled' | 'disabled' | 'unknown';
  connectedDevice: Device | null;
  onScanDevices: () => void;
  onOpenSettings: () => void;
}

// 布局结构
- Header: 应用标题 + 蓝牙状态指示器
- Content: 设备信息卡片 + 快速操作按钮
- Footer: 导航按钮 (扫描设备、设置)
\`\`\`

#### 13.3.2 设备列表页面设计
\`\`\`typescript
interface DeviceListScreenProps {
  devices: Device[];
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  onConnectDevice: (deviceId: string) => void;
  onRefresh: () => void;
}

// 设备项组件
interface DeviceItemProps {
  device: Device;
  onConnect: () => void;
  onDisconnect: () => void;
}
\`\`\`

#### 13.3.3 设备控制页面设计
\`\`\`typescript
interface DeviceControlScreenProps {
  device: Device;
  currentMode: DeviceMode;
  currentSpeed: number;
  onSetMode: (mode: DeviceMode) => void;
  onSetSpeed: (speed: number) => void;
  onDisconnect: () => void;
}

// 模式选择组件
interface ModeSelectorProps {
  currentMode: DeviceMode;
  onModeChange: (mode: DeviceMode) => void;
}

// 转速显示组件
interface SpeedDisplayProps {
  speed: number;
  onCalibrate: () => void;
}
\`\`\`

### 13.4 错误处理规格

#### 13.4.1 蓝牙错误类型
\`\`\`typescript
enum BluetoothError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BLUETOOTH_DISABLED = 'BLUETOOTH_DISABLED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED'
}
\`\`\`

#### 13.4.2 错误处理策略
1. **权限错误**
   - 显示权限说明
   - 引导用户开启权限
   - 提供设置入口

2. **连接错误**
   - 显示错误信息
   - 提供重试选项
   - 记录错误日志

3. **通信错误**
   - 自动重试机制
   - 超时处理
   - 状态恢复

### 13.5 性能指标

#### 13.5.1 响应时间要求
- 设备扫描响应: < 2秒
- 设备连接时间: < 5秒
- 指令发送响应: < 1秒
- 数据更新频率: 100ms

#### 13.5.2 资源使用要求
- 内存使用: < 100MB
- CPU使用: < 20%
- 电池消耗: 最小化
- 网络使用: 无

#### 13.5.3 兼容性要求
- Android: 6.0+ (API 23+)
- iOS: 12.0+
- 蓝牙版本: BLE 4.0+
- 设备支持: 主流手机型号

## 14. 开发规范

### 14.1 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint和Prettier规范
- 组件命名使用PascalCase
- 函数命名使用camelCase
- 常量命名使用UPPER_SNAKE_CASE

### 14.2 文件组织
- 按功能模块组织文件
- 组件文件包含.tsx、.styles.ts、.types.ts
- 服务文件使用.ts扩展名
- 工具函数单独文件

### 14.3 注释规范
- 函数和类添加JSDoc注释
- 复杂逻辑添加行内注释
- 公共API添加详细说明
- 更新日志记录变更

