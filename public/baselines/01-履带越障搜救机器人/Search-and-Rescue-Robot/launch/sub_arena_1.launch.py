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


    
    world_file = os.path.join(pkg_share, 'launch', 'sub_arena_1.sdf')

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
                   '-z', '0.2']  # Lower spawn height
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

    bridge_arm_flippers = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        name='arm_flippers_bridge',
        output='screen',
        arguments=[
            '/cmd_arm_one@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_arm_two@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_arm_three@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_front_left@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_front_right@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_back_left@std_msgs/msg/Float64@ignition.msgs.Double',
            '/cmd_f_back_right@std_msgs/msg/Float64@ignition.msgs.Double',
            '/scan@sensor_msgs/msg/LaserScan@ignition.msgs.LaserScan'
        ]
    )
    
    return LaunchDescription([
        set_ign_resource,
        set_gz_resource,
        gazebo_ignition,

        robot_state_publisher_node,
        spawn_entity_node,
        bridge_cmd_vel,
        bridge_odom,
        bridge_joint_states,
        bridge_arm_flippers
    ])
