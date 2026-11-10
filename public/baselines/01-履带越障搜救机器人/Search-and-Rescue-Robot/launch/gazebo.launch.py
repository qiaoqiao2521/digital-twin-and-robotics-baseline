import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, SetEnvironmentVariable
from launch_ros.actions import Node

def generate_launch_description():
    
    pkg_share = get_package_share_directory('sar_urdf')
    pkg_share_path = os.path.dirname(pkg_share)
    urdf_file = '/home/nikhil/ros2_ws/src/sar_urdf/urdf/sar_urdf.urdf'
    
    with open(urdf_file, 'r') as infp:
        robot_description = infp.read()
    
    # Set BOTH resource paths for Fortress
    model_path = os.path.join(pkg_share, 'models')
    resource_path = f"{pkg_share_path}:{model_path}"
    
    set_ign_resource = SetEnvironmentVariable(
        name='IGN_GAZEBO_RESOURCE_PATH',
        value=resource_path
    )
    
    set_gz_resource = SetEnvironmentVariable(
        name='GZ_SIM_RESOURCE_PATH', 
        value=resource_path
    )

    # Fix: Ignition searches IGN_GAZEBO_SYSTEM_PLUGIN_PATH for system plugins (not LD_LIBRARY_PATH)
    # Without this, libign_ros2_control-system.so fails to load and the arm has no controller
    set_ign_system_plugin = SetEnvironmentVariable(
        name='IGN_GAZEBO_SYSTEM_PLUGIN_PATH',
        value='/opt/ros/humble/lib'
    )

    set_gz_system_plugin = SetEnvironmentVariable(
        name='GZ_SIM_SYSTEM_PLUGIN_PATH',
        value='/opt/ros/humble/lib'
    )

    # Enable software rendering
    set_software_rendering = SetEnvironmentVariable(
        name='LIBGL_ALWAYS_SOFTWARE',
        value='1'
    )
    
    world_file = os.path.join(pkg_share, 'launch', 'rescue_arena.sdf')

    gazebo_ignition = ExecuteProcess(
        cmd=['ign', 'gazebo', '-r', world_file],
        output='screen'
    )
    
    robot_state_publisher_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'robot_description': robot_description,
            'use_sim_time': True
        }]
    )
    

    spawn_entity_node = Node(
        package='ros_gz_sim',
        executable='create',
        name='spawn_sar_urdf',
        output='screen',
        arguments=['-topic', '/robot_description',
                   '-name', 'sar_final_v4',
                   '-x', '-5.9400',
                   '-y', '-2.0862',
                   '-z', '0.0510',
                   '-R', '0.0000',
                   '-P', '0.0000',
                   '-Y', '3.1145']
    )
    
    # Clock bridge: allows external ROS nodes to sync to Gazebo sim time
    # Without this, external nodes get time=0 and trajectory goals complete instantly without moving
    bridge_clock = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        name='clock_bridge',
        output='screen',
        arguments=['/clock@rosgraph_msgs/msg/Clock@ignition.msgs.Clock']
    )

    bridge_cmd_vel = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        name='cmd_vel_bridge',
        output='screen',
        arguments=['/cmd_vel@geometry_msgs/msg/Twist@ignition.msgs.Twist']
    )
    
    bridge_odom = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        name='odom_bridge',
        output='screen',
        arguments=['/odom@nav_msgs/msg/Odometry@ignition.msgs.Odometry']
    )
    
    bridge_joint_states = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        name='joint_states_bridge',
        output='screen',
        arguments=['/joint_states@sensor_msgs/msg/JointState@ignition.msgs.Model']
    )

    bridge_flippers_lidar = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        name='flippers_lidar_bridge',
        output='screen',
        arguments=[
            '/cmd_f_front_left@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_front_right@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_back_left@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_back_right@std_msgs/msg/Float64@ignition.msgs.Double',
            '/scan@sensor_msgs/msg/LaserScan@ignition.msgs.LaserScan'
        ]
    )
    
    # AR4 Arm Controller Configuration
    ar4_controller_config = os.path.join(pkg_share, 'config', 'ar4_controller.yaml')
    
    # Spawn joint state broadcaster
    joint_state_broadcaster_spawner = Node(
        package='controller_manager',
        executable='spawner',
        arguments=['joint_state_broadcaster', '--controller-manager', '/controller_manager'],
        output='screen',
        ros_arguments=['--ros-args', '-p', 'use_sim_time:=true']
    )
    
    # Spawn AR4 joint trajectory controller
    ar4_controller_spawner = Node(
        package='controller_manager',
        executable='spawner',
        arguments=[
            'joint_trajectory_controller',
            '--controller-manager', '/controller_manager',
            '--controller-manager-timeout', '60'
        ],
        ros_arguments=['--ros-args', '-p', 'use_sim_time:=true'],
        output='screen'
    )
    
    return LaunchDescription([
        set_ign_resource,
        set_gz_resource,
        set_ign_system_plugin,
        set_gz_system_plugin,
        set_software_rendering,
        gazebo_ignition,

        robot_state_publisher_node,
        spawn_entity_node,
        bridge_clock,
        bridge_cmd_vel,
        bridge_odom,
        bridge_joint_states,
        bridge_flippers_lidar,
        joint_state_broadcaster_spawner,
        ar4_controller_spawner
    ])

