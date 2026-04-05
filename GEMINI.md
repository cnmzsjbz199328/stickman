# 🎬 GEMINI Architectural Standards & Development Guide

本文件定义了“高内聚、低耦合”的开发规范，旨在确保 AI 驱动的火柴人骨骼引擎在快速迭代中保持代码的健壮性与可维护性。

## 🏗️ 核心架构原则 (Architecture Principles)

### 1. 逻辑与渲染完全解耦 (Logic-Render Decoupling)
- **Engine 层 (`src/engine/`)**：纯逻辑层，处理坐标计算、物理模拟和动作状态。不得引用任何 React 组件或 DOM API（`requestAnimationFrame` 除外）。
- **Component 层 (`src/components/`)**：无状态/弱状态渲染层。仅负责将 `Engine` 提供的 `Pose` 数据转化为 SVG 属性。
- **通信机制**：通过 `Ref` 共享 `World` 实例，渲染层通过 `requestAnimationFrame` 订阅逻辑层的状态变化。

### 2. 动作注册制模式 (Action Registry Pattern)
- **禁止**在 `ActionSystem.ts` 中使用巨大的 `switch-case` 来添加新动作。
- **推荐**：所有新动作（如 `Slide`, `Climb`）应继承自 `Action` 基类，并通过 `ActionRegistry` 进行动态注册。这确保了新增动作时无需修改核心引擎逻辑。

### 3. 实体组件系统 (ECS-Lite)
- **Entity**：仅包含 ID 和基本变换属性（x, y, vx, vy）。
- **System**：如 `PhysicsSystem`，仅处理特定逻辑，不持有状态。所有状态必须保存在 `World` 或 `Entity` 中。

## 🛠️ 代码规范与拓展指南 (Development Standards)

### 1. 新增动作 (Adding New Actions)
- **路径**：`src/engine/actions/` (建议新建此目录)。
- **规范**：
    - 必须实现 `onUpdate(actor, world, progress, dt)`。
    - 必须定义 `duration` 和 `priority`（用于动作冲突控制）。
    - 动作结束时必须显式调用 `resolve()`。

### 2. 骨骼动画数据 (Animation Keyframes)
- **路径**：`src/engine/Animations.ts`。
- **规范**：
    - 动画数据应保持为 **纯 JSON 格式**，不包含逻辑。
    - 必须包含 `easeInOut` 关键帧以确保视觉流畅度。
    - 角度单位统一使用 **弧度 (Radians)**。

### 3. 高性能渲染约束
- **禁止**在 `renderLoop` 中创建闭包或临时对象。
- **禁止**触发 React `setState` 来更新关节位置。
- **必须**使用 `toFixed(2)` 处理 SVG 属性，减少 DOM 字符串解析压力。

## 🔄 全栈数据流 (Full-Stack Data Flow)

1. **AI Director (Llama 3.1)**: 生成符合 `ActionScript` 协议的 JSON 指令流。
2. **ActionSystem**: 解析指令，实例化对应的 `Action` 并压入 `Actor` 的动作队列。
3. **PhysicsSystem**: 每帧更新实体的物理坐标和碰撞检测。
4. **Stickman Component**: 读取最新 `Pose`，通过 `useRef` 直接操作 SVG DOM。

## 🚀 模块拓展优先级 (Roadmap & Decoupling Goals)
1. **[解耦] 动作冲突管理器 (Action Interrupter)**：处理当 `Hit` 动作发生时，如何优雅地取消 `Move` 或 `Attack` 动作。
2. **[高内聚] 独立碰撞盒 (Hitbox Provider)**：将碰撞逻辑从 `Action` 类中提取到独立的 `CollisionSystem`。
3. **[可拓展] 插件化 AI 协议**：支持根据不同的 LLM 动态调整 JSON Schema 适配器。
