# 已交付工业与深空数字孪生工程合集 (L0 → L3 四级下钻架构)

本压缩包收录已交付并通过真机 WebGL 与 Blender 4.5 验收的 **3 套数字孪生系统**：

## 1. 航空工业母版：波音 B737-800 整机骨架与 CFM56-7B 高涵道比涡扇发动机四级下钻系统 (`L0 → L3`)
- **入口文件**：`ThreeJS-四级下钻数字孪生运行包 (含B737涡扇与毅力号火星车)/00-工业数字孪生底座-B737与CFM56四级下钻系统.html`
- **物理与工程依据**：依据 Boeing 737-800 Airplane Characteristics (D6-58325-6) 与 CFM56-7B 站位图构建。
- **四级下钻架构**：
  - `L0`：B737-800 整机气动与站位骨架 (`STA / WL / BL`) + 双发吊挂点
  - `L1`：短舱外罩、进气道与反推装置 (`models/L1_nacelle_casings.glb`)
  - `L2`：风扇叶片、低压压气机 (LPC)、高压压气机 (HPC) 与低压涡轮 (`models/L2_turbofan_core.glb`)
  - `L3`：环形燃烧室、燃油喷嘴与高压涡轮单晶叶片热端核心 (`models/L3_hpt_combustor.glb`)

## 2. 工业工程骨架母树：B737 整机站位与大跨度悬索桥结构健康监测 (SHM) 数字孪生
- **入口文件**：`ThreeJS-四级下钻数字孪生运行包 (含B737涡扇与毅力号火星车)/00B-工业数字孪生骨架母树-B737整机站位与悬索大桥.html`

## 3. 深空探测母版：NASA Mars 2020「毅力号 (Perseverance)」核动力火星车与 EDL 空中吊车四级下钻系统 (`L0 → L3`)
- **入口文件**：`ThreeJS-四级下钻数字孪生运行包 (含B737涡扇与毅力号火星车)/00C-深空核动力巡视器数字孪生-毅力号与空中吊车四级下钻系统.html`
- **物理与工程依据**：依据 NASA JPL `Mars 2020 Perseverance` 官方 70 部件高精度网格（199,521 三角面）与 `JPL D-105568` 巡视器机械坐标系 (`RMCS +X/+Y/+Z`) 构建。
- **四级下钻架构**：
  - `L0`：EDL 空中吊车反推着陆级（8×MLE 火箭发动机 + 3×7.6m 尼龙主吊索 Bridles + 脐带缆）与 RMCS 坐标架
  - `L1`：Rocker-Bogie 主副摇臂差速悬架与 6 轮独立转向/驱动分系统 (`models/L1_mobility_rocker_bogie.glb`, 95,038 面)
  - `L2`：2.1m 五自由度机械臂、转塔钻探取样头 (Turret/Corer) 与 SuperCam 遥感桅杆 (`models/L2_turret_mast_robotics.glb`, 43,550 面)
  - `L3`：主车体舱、MMRTG 钚-238 核同位素热电机、SHERLOC/PIXL 载荷与自适应样本缓存舱 (`models/L3_chassis_mmrtg_lab.glb`, 60,933 面)

## 本地运行方式
在 `ThreeJS-四级下钻数字孪生运行包 (含B737涡扇与毅力号火星车)` 目录下启动任意静态 HTTP 服务即可离线运行（内置完整 `vendor/three` 依赖，无需联网）：
```bash
python3 -m http.server 8080
```
然后浏览器访问 `http://127.0.0.1:8080/00C-深空核动力巡视器数字孪生-毅力号与空中吊车四级下钻系统.html`。
