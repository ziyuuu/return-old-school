# 技术决策 M1.0 / ADR-001

采用 Three.js 0.180.0 + TypeScript 5.7.3 + Vite 6.1.0。锁定版本用于可复现构建，不声称是最新版本。运行时不请求CDN、照片或字体。

选择理由：仓库目前没有可直接迁移的完整场景工程；历史v0.2原生WebGL查看器仍留在旧交付包，不覆盖、不宣称无损迁移。新工程位于apps/campus，使用已有设施ID、M0假设与连接规则。原有资料及剧情保持不变。

Three.js官方安装方式：https://threejs.org/manual/en/installation.html
相机控制：https://threejs.org/docs/pages/OrbitControls.html
色彩空间：https://threejs.org/manual/en/color-management.html

现阶段不用Rapier，也不手写伪物理。只有自由相机和检查用路线；实际行走/楼梯碰撞在后续M1阶段单列交付。无React、无后端、无账户、无夜景、无玩法。

依赖目录不提交。构建产物可用静态服务器部署；standalone脚本输出包含Three.js及其MIT声明的单HTML供本地审阅。源图与照片不作为运行时纹理。
