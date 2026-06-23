# Agents Monorepo

基于 Yarn Workspaces 的 monorepo 项目。

## 项目结构

```
agents/
├── apps/          # 应用程序
├── packages/      # 共享包/库
├── package.json   # 根配置
└── .yarnrc.yml    # Yarn 配置
```

## 快速开始

```bash
# 安装依赖
yarn install

# 开发模式
yarn dev

# 构建所有包
yarn build

# 运行测试
yarn test
```

## 工作区管理

```bash
# 给某个包添加依赖
yarn workspace <package-name> add <dependency>

# 运行某个包的脚本
yarn workspace <package-name> run <script>

# 添加新包
# 在 packages/ 或 apps/ 下创建目录并添加 package.json
```
