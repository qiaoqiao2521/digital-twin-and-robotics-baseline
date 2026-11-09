# 数字孪生已交付工程与机器人现实基准总包 (2026-11-09)

本归档包位于 `/home/muqiao/Videos/Studio/`，包含以下两大核心部分：

1. **`01-已交付数字孪生工程合集/`**
   - 收录已交付并验收的 **波音 B737-800 & CFM56-7B 涡扇发动机四级下钻数字孪生 (`L0→L3`)**、**B737 与大跨度悬索桥工程骨架母树**、以及 **NASA 毅力号核动力火星车与空中吊车四级下钻数字孪生 (`L0→L3`)** 全套离线可运行 HTML、L1~L3 `.glb` 模型、Three.js 本地库与 Blender 构建源码。
2. **`02-机器人数字孪生现实基准库_URDF与XML原件/`**
   - 收录 **39 个全球主流开源机器人仓库（110+ 款机器人型号）** 的 **100% 原装未二改运动学基准文件（`.urdf` / `.xml` 优先，兼顾 `.xacro` / `.sdf`）** 与 **全套结构说明文档（`README` / `YAML` 关节表 / 结构示意图）**，并附带详细的《`README_来源说明与结构导览.md`》与《`MANIFEST_全量机器人基准清单.json`》。
# 具身智能与特种机器人「数字孪生现实基准库」（全量 URDF / XML 原件 + 结构说明总集）

- **打包时间**：`2026-11-09 20:40:26`
- **收录开源仓库总数**：**39 个顶级机器人开源项目**（涵盖 110+ 款独立机器人型号）
- **收录原装运动学基准文件（`.urdf` / `.xml` / `.xacro` / `.sdf`）**：**1,138 个（100% 原始文件，未经任何二改或清洗）**
- **收录结构说明、关节配置与示意图（`README` / `YAML` / `package.xml` / 结构图）**：**1,499 个**

---

## 一、 为什么这些文件是数字孪生的「现实基准」？

1. **100% 原厂工程真值（零二改）**：本压缩包内所有 `.urdf`（ROS 统一机器人描述格式）、`.xml`（Google DeepMind MuJoCo MJCF 格式）、`.xacro` 与 `.sdf` 均直接提取自 NASA、Google DeepMind、MIT、ETH ANYbotics、宇树科技 (Unitree)、傅利叶智能、Blue Robotics、Franka Emika、Universal Robots 等官方开源仓库，保留原汁原味的零件树（`link/body`）、关节转轴（`axis`）、安装位姿偏移（`origin xyz/rpy`）、运动限位（`limit`）与转动惯量（`inertial`）。
2. **首选文件快速定位（`_首选基准原件_PRIMARY/`）**：每个仓库文件夹下都自动提取了优先级最高（`.urdf` 与 `.xml` 优先）的主基准文件放入 `_首选基准原件_PRIMARY/` 子目录，并附带 `00_来源与结构说明.md`。
3. **配套说明与关节配置齐全**：除运动学文件外，完整保留了各仓库的 `README.md`、关节名称与控制参数表（`.yaml`）、`package.xml` 以及原始结构示意图，打开即可一眼看清整机拓扑结构。

---

## 二、 全量 39 个机器人开源库来源、介绍与首选基准一览表

| 分类目录 | 仓库名称 | 机型介绍与结构亮点 | 官方开源来源 (GitHub) | 首选现实基准文件 (`.urdf` / `.xml` 优先) | 连杆/关节数 | 基准文件数 | 说明文件数 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `01-履带越障搜救机器人` | **`Search-and-Rescue-Robot`** | 履带越障搜救机器人（履带主底盘 + 4×越障摆臂 Flippers + 6轴 AR4 机械臂 + 360° 激光雷达） | [Search-and-Rescue-Robot](https://github.com/nikhil-prasad-k/Search-and-Rescue-Robot.git) | `urdf/sar_urdf.urdf` | 20 连杆 / 25 关节 | 16 | 15 |
| `02-水下机器人ROV与深海作业系统` | **`bluerov2`** | Blue Robotics BlueROV2 行业标准6推进器水下机器人 | [bluerov2](https://github.com/CentraleNantesROV/bluerov2.git) | `bluerov2_description/urdf/snippets/common.urdf.xacro` | 2 连杆 / 0 关节 | 18 | 15 |
| `02-水下机器人ROV与深海作业系统` | **`bluerov_ros_playground`** | BlueROV2 + Ping360 声呐水下机器人 Gazebo/SDF/URDF 仿真模型 | [bluerov_ros_playground](https://github.com/patrickelectric/bluerov_ros_playground.git) | `model/BlueRov2_thrusters.urdf` | 0 连杆 / 6 关节 | 4 | 9 |
| `02-水下机器人ROV与深海作业系统` | **`desistek_saga`** | Desistek SAGA 工业级深水勘测 ROV 机器人 | [desistek_saga](https://github.com/uuvsimulator/desistek_saga.git) | `desistek_saga_description/urdf/desistek_saga_base.urdf.xacro` | 2 连杆 / 0 关节 | 5 | 20 |
| `02-水下机器人ROV与深海作业系统` | **`eca_a9`** | ECA Group A9 自主水下航行器 (AUV) 鱼雷型探测机器人 | [eca_a9](https://github.com/uuvsimulator/eca_a9.git) | `eca_a9_description/robots/eca_a9_default.urdf.xacro` | 多机型合集/宏模板 | 4 | 22 |
| `02-水下机器人ROV与深海作业系统` | **`rexrov2`** | RexROV2 深海重型作业级水下机器人（含 Oberon7/4 机械臂搭载配置） | [rexrov2](https://github.com/uuvsimulator/rexrov2.git) | `rexrov2_description/urdf/rexrov2_base.xacro` | 1 连杆 / 0 关节 | 9 | 21 |
| `02-水下机器人ROV与深海作业系统` | **`uuv_manipulators`** | Oberon7 与 Oberon4 七轴深海液压水下机械爪与串联机械臂 | [uuv_manipulators](https://github.com/uuvsimulator/uuv_manipulators.git) | `oberon7/oberon7_description/models/oberon7/model.urdf` | 12 连杆 / 19 关节 | 13 | 40 |
| `02-水下机器人ROV与深海作业系统` | **`uuv_simulator`** | UUV Simulator 工业水下机器人与深海防喷器阀门台（RexROV / 海底传感器 / BOP Panel） | [uuv_simulator](https://github.com/uuvsimulator/uuv_simulator.git) | `uuv_descriptions/urdf/common.urdf.xacro` | 2 连杆 / 0 关节 | 61 | 145 |
| `03-宇树Unitree四足与人形全系_URDF` | **`unitree_ros`** | 宇树科技官方 ROS URDF 全系库（Go1 / Go2 / B1 / B2 / A1 / Aliengo / Laikago / H1 / G1 29-DOF 灵巧手 / Z1 机械臂） | [unitree_ros](https://github.com/unitreerobotics/unitree_ros.git) | `robots/h2_plus/H2_Plus.urdf` | 98 连杆 / 97 关节 | 157 | 64 |
| `04-宇树Unitree物理仿真全系_MJCF_XML` | **`unitree_mujoco`** | 宇树科技官方 MuJoCo MJCF (.xml) 物理仿真基准库（Go2 / B2 / H1 / G1 / Z1） | [unitree_mujoco](https://github.com/unitreerobotics/unitree_mujoco.git) | `unitree_robots/a2/qrc_map_sloped.xml` | 171 连杆 / 0 关节 | 34 | 39 |
| `05-DeepMind_MuJoCo_Menagerie_50款名机基准库_XML` | **`mujoco_menagerie`** | Google DeepMind 官方维护的 50+ 款全球顶级机器人高精度 MJCF (.xml) 基准总库（含波士顿动力 Spot、Unitree、Franka、UR5e/10e、Shadow Hand、ANYmal B/C、Cassie、Apptronik Apollo、Talos 等） | [mujoco_menagerie](https://github.com/google-deepmind/mujoco_menagerie.git) | `google_barkour_vb/barkour_vb_rev_1_0_head_straight.urdf` | 35 连杆 / 34 关节 | 270 | 440 |
| `06-双足人形具身智能机器人` | **`GingerURDF`** | 达闼 CloudMinds Ginger 34自由度双臂服务人形机器人 URDF 基准 | [GingerURDF](https://github.com/Rayckey/GingerURDF.git) | `urdf/gingerurdf.urdf` | 50 连杆 / 49 关节 | 1 | 3 |
| `06-双足人形具身智能机器人` | **`Wiki-GRx-Models-FourierN1`** | 傅利叶智能 Fourier GR-1 / GR-2 / N1 全尺寸双足人形机器人官方 URDF 库 | [Wiki-GRx-Models-FourierN1](https://github.com/FFTAI/Wiki-GRx-Models.git) | `GRX/GR1/gr1t1/urdf/gr1t1_fourier_hand_6dof.urdf` | 71 连杆 / 70 关节 | 21 | 7 |
| `06-双足人形具身智能机器人` | **`cassie_description`** | Agility Robotics Cassie 双足动态步行机器人 ROS URDF 基准 | [cassie_description](https://github.com/robot-descriptions/cassie_description) | `urdf/cassie_v4.urdf` | 17 连杆 / 26 关节 | 3 | 6 |
| `06-双足人形具身智能机器人` | **`cassie_mj_description`** | Agility Robotics Cassie 双足机器人 MuJoCo XML 基准 | [cassie_mj_description](https://github.com/rohanpsingh/cassie_mj_description.git) | `xml/cassie.xml` | 25 连杆 / 23 关节 | 1 | 0 |
| `06-双足人形具身智能机器人` | **`ergocub-software`** | 意大利技术研究院 IIT ergoCub 全尺寸双足人形具身智能机器人（含完整传感器与灵巧手 URDF） | [ergocub-software](https://github.com/icub-tech-iit/ergocub-software.git) | `urdf/ergoCub/robots/ergoCubSN001/model.urdf` | 205 连杆 / 204 关节 | 73 | 56 |
| `06-双足人形具身智能机器人` | **`nasa-urdf-robots`** | NASA 官方 Valkyrie (R5) 双足人形太空机器人与 Astrobee 国际空间站自由飞行机器人 | [nasa-urdf-robots](https://github.com/gkjohnson/nasa-urdf-robots.git) | `val_description/model/robots/valkyrie_sim_angled_legj1s.urdf` | 78 连杆 / 137 关节 | 39 | 37 |
| `06-双足人形具身智能机器人` | **`pepper_description`** | SoftBank Pepper 服务型半人形机器人官方 URDF 基准 | [pepper_description](https://github.com/jrl-umi3218/pepper_description.git) | `urdf/pepper.urdf` | 65 连杆 / 64 关节 | 1 | 29 |
| `06-双足人形具身智能机器人` | **`sigmaban_urdf`** | Rhoban Sigmaban 双足足球人形机器人 URDF 基准 | [sigmaban_urdf](https://github.com/Rhoban/sigmaban_urdf.git) | `robot.urdf` | 27 连杆 / 26 关节 | 1 | 1 |
| `06-双足人形具身智能机器人` | **`talos-data`** | PAL Robotics TALOS 全尺寸工业重型双足人形机器人官方 URDF 库 | [talos-data](https://github.com/stack-of-tasks/talos-data.git) | `urdf/talos_full_v2_with_lidar.urdf` | 75 连杆 / 118 关节 | 53 | 14 |
| `07-四足越野与移动操作复合机器人` | **`anymal_c_simple_description`** | 瑞士联邦理工 ETH / ANYbotics ANYmal C 工业级四足巡检机器人 URDF 基准 | [anymal_c_simple_description](https://github.com/ANYbotics/anymal_c_simple_description.git) | `urdf/anymal.urdf` | 78 连杆 / 77 关节 | 1 | 5 |
| `07-四足越野与移动操作复合机器人` | **`husky`** | Clearpath Robotics Husky A200 野外四轮差速越野机器人底盘 URDF/XACRO 基准 | [husky](https://github.com/husky/husky.git) | `husky_description/urdf/empty.urdf` | 多机型合集/宏模板 | 11 | 42 |
| `07-四足越野与移动操作复合机器人` | **`mini_cheetah_urdf`** | MIT 麻省理工 Mini Cheetah 猎豹高动态四足机器人 URDF 基准 | [mini_cheetah_urdf](https://github.com/Derek-TH-Wang/mini_cheetah_urdf.git) | `urdf/laikago_toes_limits.urdf` | 17 连杆 / 16 关节 | 6 | 6 |
| `07-四足越野与移动操作复合机器人` | **`pal_urdf_utils`** | PAL Robotics TIAGo 移动操作臂与 Hey5 五指灵巧手 URDF/XACRO 基准 | [pal_urdf_utils](https://github.com/pal-robotics/pal_urdf_utils.git) | `urdf/camera/orbbec_astra.urdf.xacro` | 7 连杆 / 7 关节 | 65 | 5 |
| `07-四足越野与移动操作复合机器人` | **`pmb2_robot`** | PAL Robotics PMB-2 室内移动机器人底盘 URDF/XACRO 基准 | [pmb2_robot](https://github.com/pal-robotics/pmb2_robot.git) | `pmb2_description/urdf/base/base_sensors.urdf.xacro` | 多机型合集/宏模板 | 14 | 30 |
| `07-四足越野与移动操作复合机器人` | **`stretch4_urdf`** | Hello Robot Stretch 4 新一代移动操作机器人 URDF 基准 | [stretch4_urdf](https://github.com/hello-robot/stretch4_urdf.git) | `stretch4_urdf/SE4_tools/eoa_wrist_dw4_tool_sg4/eoa_wrist_dw4_tool_sg4.urdf` | 8 连杆 / 7 关节 | 8 | 32 |
| `07-四足越野与移动操作复合机器人` | **`stretch_description`** | Hello Robot Stretch 标准 ROS Description 基准 | [stretch_description](https://github.com/robot-descriptions/stretch_description.git) | `urdf/stretch.urdf` | 44 连杆 / 43 关节 | 1 | 5 |
| `07-四足越野与移动操作复合机器人` | **`stretch_urdf`** | Hello Robot Stretch RE1 / RE2 / 3 具身移动操作机器人官方 URDF 全集 | [stretch_urdf](https://github.com/hello-robot/stretch_urdf.git) | `stretch_urdf/SE3/stretch_description_SE3_eoa_wrist_dw3_tool_sg3_pro.urdf` | 61 连杆 / 60 关节 | 81 | 5 |
| `08-工业与协作机械臂及灵巧夹爪` | **`Universal_Robots_ROS2_Description`** | 优傲 Universal Robots 官方 UR3 / UR3e / UR5 / UR5e / UR10 / UR10e / UR16e / UR20 / UR30 全系六轴机械臂 URDF/XACRO 基准 | [Universal_Robots_ROS2_Description](https://github.com/UniversalRobots/Universal_Robots_ROS2_Description.git) | `launch/view_ur.launch.xml` | 多机型合集/宏模板 | 9 | 97 |
| `08-工业与协作机械臂及灵巧夹爪` | **`baxter_common`** | Rethink Robotics Baxter 工业双臂协作机器人官方 URDF/XACRO 基准 | [baxter_common](https://github.com/RethinkRobotics/baxter_common.git) | `baxter_description/urdf/baxter.urdf` | 49 连杆 / 63 关节 | 23 | 13 |
| `08-工业与协作机械臂及灵巧夹爪` | **`epfl-lasa`** | 德国 KUKA LBR iiwa 7 / 14 七轴工业力控机械臂 URDF/XACRO 基准 | [epfl-lasa](https://github.com/epfl-lasa/iiwa_ros.git) | `iiwa_moveit/launch/trajectory_execution.launch.xml` | 多机型合集/宏模板 | 20 | 30 |
| `08-工业与协作机械臂及灵巧夹爪` | **`franka_description`** | 德国 Franka Emika Panda / FR3 七轴力控协作机械臂官方 URDF/XACRO 基准 | [franka_description](https://github.com/frankarobotics/franka_description.git) | `robots/fr3_duo/fr3_duo.urdf.xacro` | 1 连杆 / 0 关节 | 39 | 39 |
| `08-工业与协作机械臂及灵巧夹爪` | **`kinova-ros`** | 加拿大 Kinova Jaco2 / Gen3 超轻量协作机械臂与三指夹爪官方 URDF/XACRO 基准 | [kinova-ros](https://github.com/Kinovarobotics/kinova-ros.git) | `kinova_moveit/robot_configs/j2s7s300_moveit_config/launch/trajectory_execution.launch.xml` | 多机型合集/宏模板 | 63 | 116 |
| `08-工业与协作机械臂及灵巧夹爪` | **`kinova_mj_description`** | Kinova Gen3 七轴机械臂 MuJoCo MJCF (.xml) 基准 | [kinova_mj_description](https://github.com/mathieu-celerier/kinova_mj_description.git) | `xml/kinova_camera_gripper.xml` | 14 连杆 / 11 关节 | 6 | 9 |
| `08-工业与协作机械臂及灵巧夹爪` | **`robotiq_2f_85`** | Robotiq 2F-85 二指自适应平行连杆机械夹爪 URDF 基准 | [robotiq_2f_85](https://github.com/nickswalker/robotiq-2f-85.git) | `robotiq_2f_85_gripper_visualization/urdf/robotiq_arg2f_85_macro.xacro` | 8 连杆 / 8 关节 | 5 | 11 |
| `08-工业与协作机械臂及灵巧夹爪` | **`robotiq_arg85_description`** | Robotiq ARG85 工业夹爪 URDF/XACRO 基准 | [robotiq_arg85_description](https://github.com/a-price/robotiq_arg85_description.git) | `robots/robotiq_arg85_description.URDF` | 9 连杆 / 8 关节 | 1 | 5 |
| `09-无人机与全局索引工具` | **`awesome-robot-descriptions`** | GitHub 200+ 款主流机器人 URDF / MJCF 开源总索引表（Awesome Robot Descriptions） | [awesome-robot-descriptions](https://github.com/robot-descriptions/awesome-robot-descriptions.git) | `README.md` | 多机型合集/宏模板 | 0 | 58 |
| `09-无人机与全局索引工具` | **`robot_descriptions.py`** | robot_descriptions.py 官方 200+ 款机器人元数据注册表与一键加载器源码 | [robot_descriptions.py](https://github.com/robot-descriptions/robot_descriptions.py.git) | `README.md` | 多机型合集/宏模板 | 0 | 5 |
| `09-无人机与全局索引工具` | **`skydio_x2_description`** | Skydio X2 自主避障四旋翼无人机 MJCF (.xml) 基准 | [skydio_x2_description](https://github.com/lvjonok/skydio_x2_description.git) | `urdf/skydio_x2.urdf` | 7 连杆 / 6 关节 | 1 | 3 |

---

## 三、 重点合集内含子机型导航

### 1. `05-DeepMind_MuJoCo_Menagerie_50款名机基准库_XML/mujoco_menagerie/`
Google DeepMind 官方维护的工业级基准库，每个子目录均为一款独立机器人，包含原装 `.xml` (MJCF) + `README.md` + 高清预览图：
- **四足与双足**：`boston_dynamics_spot` (波士顿动力 Spot)、`agility_cassie`、`anybotics_anymal_b`、`anybotics_anymal_c`、`unitree_a1`、`unitree_go1`、`unitree_go2`、`unitree_h1`、`unitree_g1`、`pal_talos`、`apptronik_apollo`、`fourier_n1`、`berkeley_humanoid`、`booster_t1`、`robotis_op3`
- **机械臂与灵巧手**：`franka_emika_panda`、`franka_fr3`、`universal_robots_ur5e`、`universal_robots_ur10e`、`kuka_iiwa_14`、`kinova_gen3`、`ufactory_xarm7`、`shadow_hand` (五指灵巧手)、`wonik_allegro`、`leap_hand`、`robotiq_2f85`
- **无人机与移动操作**：`skydio_x2`、`bitcraze_crazyflie_2`、`hello_robot_stretch`、`hello_robot_stretch_3`、`google_robot`、`stanford_tidybot`

### 2. `03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/`
宇树科技全系列官方纯 `.urdf` 基准（无需编译宏，直接可读完整关节树）：
- `go2_description/urdf/go2_description.urdf`（Go2 四足机器狗）
- `g1_description/g1_29dof_with_hand_rev_1_0.urdf`（G1 29自由度带灵巧手双足人形）
- `h1_description/urdf/h1_with_hand.urdf`（H1 全尺寸双足人形带手）
- `b2_description` / `b1_description`（工业重型四足机器狗 B1 / B2）
- `z1_description/xacro/z1.urdf`（Z1 六轴轻量机械臂）

### 3. `01-履带越障搜救机器人/Search-and-Rescue-Robot/`
- 首选纯 URDF：`urdf/sar_urdf.urdf`（含主履带车体 + 前后 4 摆臂 Flippers + 6轴 AR4 机械臂完整装配树）
- 独立机械臂配置：`ar4_gazebo_sim/urdf/gz_ar4.urdf.xacro` + `ar4_gazebo_sim/config/joint_names_ar4_urdf.yaml`

### 4. `02-水下机器人ROV与深海作业系统/`
- `bluerov2`：`bluerov2_description/urdf/bluerov2.xacro` + `thrusters.xacro` + `sensors.xacro`
- `bluerov_ros_playground`：`model/BlueRov2/model.sdf` + `model.config`（含 Ping360 声呐与 6 推进器完整坐标）
- `rexrov2` & `uuv_manipulators`：`rexrov2_description/robots/rexrov2_oberon7.xacro` + `oberon7_description`（深海 ROV + 7轴液压水下机械爪）