#!/usr/bin/env python3

import sys
import termios
import tty
import select
import rclpy
import time
import os
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from sensor_msgs.msg import JointState

# Key mappings
msg = """
Control Your AR4 Arm! (Hold to Move)
---------------------------
Hold keys to move joints:
   1/q : Joint 1 +/-
   2/w : Joint 2 +/-
   3/e : Joint 3 +/-
   4/r : Joint 4 +/-
   5/t : Joint 5 +/-
   6/y : Joint 6 +/-

   h : Return to Home Position

CTRL-C to quit
"""

# Speed settings (rad/s)
JOINT_SPEED = 0.5  # radians per second

key_bindings = {
    '1': (0, JOINT_SPEED), 'q': (0, -JOINT_SPEED),
    '2': (1, JOINT_SPEED), 'w': (1, -JOINT_SPEED),
    '3': (2, JOINT_SPEED), 'e': (2, -JOINT_SPEED),
    '4': (3, JOINT_SPEED), 'r': (3, -JOINT_SPEED),
    '5': (4, JOINT_SPEED), 't': (4, -JOINT_SPEED),
    '6': (5, JOINT_SPEED), 'y': (5, -JOINT_SPEED),
}

class AR4Teleop(Node):
    def __init__(self):
        super().__init__('ar4_teleop')
        self.arm_publisher = self.create_publisher(JointTrajectory, '/joint_trajectory_controller/joint_trajectory', 10)
        
        # Create QoS profile with RELIABLE reliability to match Gazebo bridge
        qos_profile = QoSProfile(depth=10)
        qos_profile.reliability = ReliabilityPolicy.RELIABLE
        
        self.joint_subscription = self.create_subscription(
            JointState, 
            '/joint_states', 
            self.joint_state_callback, 
            qos_profile
        )
        
        self.joint_names = ['joint_1', 'joint_2', 'joint_3', 'joint_4', 'joint_5', 'joint_6']
        self.current_positions = [0.0] * 6
        self.target_positions = [0.0] * 6
        self.last_published_targets = [0.0] * 6
        self.received_state = False
        
        self.last_loop_time = time.time()
        self.last_publish_time = time.time()
        self.settings = termios.tcgetattr(sys.stdin)

    def joint_state_callback(self, msg):
        for i, name in enumerate(self.joint_names):
            if name in msg.name:
                idx = msg.name.index(name)
                self.current_positions[i] = msg.position[idx]
                if not self.received_state:
                    # Initialize target positions to current positions on first callback
                    self.target_positions[i] = msg.position[idx]
        self.received_state = True

    def publish_trajectory(self):
        if not self.received_state:
            return
            
        traj_msg = JointTrajectory()
        traj_msg.joint_names = self.joint_names
        
        point = JointTrajectoryPoint()
        point.positions = list(self.target_positions)
        point.time_from_start.sec = 0
        point.time_from_start.nanosec = 200000000  # 0.2s for smooth control
        
        traj_msg.points = [point]
        self.arm_publisher.publish(traj_msg)
        
        self.last_publish_time = time.time()

    def move_to_home(self):
        self.get_logger().info("Returning to home position...")
        self.target_positions = [0.0] * 6
        
        traj_msg = JointTrajectory()
        traj_msg.joint_names = self.joint_names
        
        point = JointTrajectoryPoint()
        point.positions = [0.0] * 6
        point.time_from_start.sec = 2
        
        traj_msg.points = [point]
        self.arm_publisher.publish(traj_msg)

    def run(self):
        # Enter Raw Mode ONCE
        tty.setraw(sys.stdin.fileno())
        
        print(msg)
        
        try:
            while rclpy.ok():
                # Spin to get latest joint states
                rclpy.spin_once(self, timeout_sec=0.0)
                
                # Loop Timing
                current_time = time.time()
                dt = current_time - self.last_loop_time
                self.last_loop_time = current_time

                # Check Input with Timeout
                rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
                
                # Default: no movement
                joint_velocities = [0.0] * 6
                
                if rlist:
                    # Input detected! Read everything available
                    try:
                        key_data = os.read(sys.stdin.fileno(), 4096).decode('utf-8', errors='ignore')
                    except OSError:
                        key_data = ''

                    # Check for exit first
                    if '\x03' in key_data:  # Ctrl-C
                        break
                    
                    # Check for home command
                    if 'h' in key_data:
                        self.move_to_home()
                        print("\rReturning to home position...                    ")
                        continue
                    
                    # Parse joint controls
                    for key, (joint_idx, velocity) in key_bindings.items():
                        if key in key_data:
                            joint_velocities[joint_idx] = velocity
                
                # Update target positions based on velocities
                if self.received_state:
                    # Check if any joint is being commanded
                    any_movement = any(v != 0.0 for v in joint_velocities)
                    
                    if any_movement:
                        # Update targets based on velocities
                        for i in range(6):
                            self.target_positions[i] += joint_velocities[i] * dt
                        # Publish when actively moving
                        self.publish_trajectory()
                    else:
                        # No keys pressed - periodically command to hold current position
                        # Only update if enough time passed to avoid flooding
                        time_since_publish = current_time - self.last_publish_time
                        if time_since_publish > 0.1:  # Publish hold command every 0.1s
                            self.target_positions = list(self.current_positions)
                            self.publish_trajectory()
                    
                    # Print status using ACTUAL joint positions from feedback
                    print(f"\rJoints: J1:{self.current_positions[0]: >6.3f} J2:{self.current_positions[1]: >6.3f} J3:{self.current_positions[2]: >6.3f} J4:{self.current_positions[3]: >6.3f} J5:{self.current_positions[4]: >6.3f} J6:{self.current_positions[5]: >6.3f}   ", end="")
                
                # Small sleep to prevent CPU spinning
                time.sleep(0.01)

        except Exception as e:
            print(e)
        finally:
            # Restore terminal settings
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.settings)
            print("\nStopped.")

def main(args=None):
    rclpy.init(args=args)
    node = AR4Teleop()
    node.run()
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
