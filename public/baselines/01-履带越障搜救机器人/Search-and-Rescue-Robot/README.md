# Search and Rescue Robot Simulation

This is a ROS 2 package (`sar_urdf`) for simulating an articulated search and rescue robot in Gazebo (Ignition). The robot features a tracked base, front and rear flippers for negotiating rough terrain, an articulated AR4 arm, and a 2D LiDAR for mapping.

## Overview

The package contains:
- **`urdf/`**, **`meshes/`**, **`models/`**: 3D models and URDF definitions of the robot and its components.
- **`launch/`**: Launch files for Gazebo simulation, SLAM (Cartographer), and visualization.
- **`scripts/`**: Python teleoperation scripts for driving the base, moving the flippers, and controlling the arm.
- **`config/`**: ROS 2 controllers configuration.

## Dependencies

- ROS 2 (Humble/Iron/Jazzy)
- Gazebo (Ignition Fortress or later)
- `ros_gz_sim`, `ros_gz_bridge`
- `robot_state_publisher`, `joint_state_broadcaster`, `joint_trajectory_controller`
- `cartographer_ros` (for mapping)

## Build Instructions

```bash
cd ~/ros2_ws
colcon build --packages-select sar_urdf
source install/setup.bash
```

## Running the Simulation

To launch the robot in the rescue arena Gazebo environment with all necessary ROS 2 control nodes and bridges:

```bash
ros2 launch sar_urdf gazebo.launch.py
```

## Teleoperation

You can control the robot's base and flippers using the combined teleop script. Open a new terminal and run:

```bash
ros2 run sar_urdf combined_teleop.py
```

**Combined Teleop Controls** *(Hold button to move, release to stop)*:
- **Base**: `W` (Forward), `S` (Backward), `A` (Left), `D` (Right)
- **Front Flippers**: `Up Arrow` (Raise), `Down Arrow` (Lower)
- **Back Flippers**: `Left Arrow` (Raise), `Right Arrow` (Lower)
- *Hold Shift to move flippers at 3x speed*

To control just the AR4 arm:
```bash
ros2 run sar_urdf ar4_teleop.py
```

**AR4 Arm Controls** *(Hold button to move, release to stop)*:
- **Joint 1**: `1` (+), `q` (-)
- **Joint 2**: `2` (+), `w` (-)
- **Joint 3**: `3` (+), `e` (-)
- **Joint 4**: `4` (+), `r` (-)
- **Joint 5**: `5` (+), `t` (-)
- **Joint 6**: `6` (+), `y` (-)
- **Home Position**: `h` (Press to return all joints to the default position)

## Mapping (SLAM)

To run Cartographer for 2D mapping using the onboard LiDAR:

```bash
ros2 launch sar_urdf cartographer.launch.py
```
