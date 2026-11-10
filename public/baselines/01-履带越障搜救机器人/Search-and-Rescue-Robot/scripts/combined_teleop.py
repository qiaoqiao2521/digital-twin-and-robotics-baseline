#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import Float64
import sys, select, termios, tty
import time
import os

msg = """
Combined Teleop Control for SAR Robot
-------------------------------------
Base Control (Hold to Move):
    w : Move Forward
    s : Move Backward
    a : Turn Left
    d : Turn Right
    
Flipper Control (Hold to Move):
    Up    : Raise Front Flippers
    Down  : Lower Front Flippers
    Left  : Raise Back Flippers
    Right : Lower Back Flippers
    (Hold Shift for 3x speed)

CTRL-C to quit
"""

# SPEED SETTINGS
LINEAR_SPEED = 2.5 
ANGULAR_SPEED = 4.5 
FLIPPER_SPEED_RAD_S = 0.5

class CombinedTeleop(Node):
    def __init__(self):
        super().__init__('combined_teleop')
        
        self.pub_cmd_vel = self.create_publisher(Twist, '/cmd_vel', 10)
        
        self.pub_FL = self.create_publisher(Float64, '/cmd_f_front_left', 10)
        self.pub_FR = self.create_publisher(Float64, '/cmd_f_front_right', 10)
        self.pub_BL = self.create_publisher(Float64, '/cmd_f_back_left', 10)
        self.pub_BR = self.create_publisher(Float64, '/cmd_f_back_right', 10)

        # State
        self.linear_vel = 0.0
        self.angular_vel = 0.0
        self.flipper_front_angle = 0.0
        self.flipper_back_angle = 0.0
        
        self.last_loop_time = time.time()
        self.settings = termios.tcgetattr(sys.stdin)

    def publish_state(self):
        # Base
        twist = Twist()
        twist.linear.x = self.linear_vel
        twist.angular.z = self.angular_vel
        self.pub_cmd_vel.publish(twist)

        # Flippers
        # Front
        msg_fl = Float64()
        msg_fl.data = -1.0 * self.flipper_front_angle
        msg_fr = Float64()
        msg_fr.data = self.flipper_front_angle
        self.pub_FL.publish(msg_fl)
        self.pub_FR.publish(msg_fr)

        # Back
        msg_bl = Float64()
        msg_bl.data = -1.0 * self.flipper_back_angle
        msg_br = Float64()
        msg_br.data = self.flipper_back_angle
        self.pub_BL.publish(msg_bl)
        self.pub_BR.publish(msg_br)

        print(f"\rBase: Lin {self.linear_vel: >5.2f} Ang {self.angular_vel: >5.2f} | Flippers: Front {self.flipper_front_angle: >5.2f} Back {self.flipper_back_angle: >5.2f}   ", end="")

    def run(self):
        # Enter Raw Mode ONCE
        tty.setraw(sys.stdin.fileno())
        
        print(msg)
        
        try:
            while rclpy.ok():
                # Loop Timing
                current_time = time.time()
                dt = current_time - self.last_loop_time
                self.last_loop_time = current_time

                # Check Input with Timeout
                # Timeout must be slightly larger than key-repeat interval (usually ~30-50ms)
                # to avoid choppy movement. 0.1s is safe.
                rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
                
                # Default Targets (Stop)
                target_base_lin = 0.0
                target_base_ang = 0.0
                target_flipper_front_vel = 0.0
                target_flipper_back_vel = 0.0
                
                if rlist:
                    # Input detected! Read everything available to drain buffer (prevents lag)
                    try:
                        key_data = os.read(sys.stdin.fileno(), 4096).decode('utf-8', errors='ignore')
                    except OSError:
                        key_data = ''

                    # Check for exit first
                    if '\x03' in key_data: # Ctrl-C
                        break
                    
                    # Parse Controls from the chunk
                    # We check presence because multiple keys might be in the chunk
                    
                    # Base Control (Swapped per user req)
                    # W -> Ang Forward
                    if 'w' in key_data: target_base_ang = ANGULAR_SPEED
                    elif 's' in key_data: target_base_ang = -ANGULAR_SPEED
                    
                    # A -> Lin Left
                    if 'a' in key_data: target_base_lin = LINEAR_SPEED
                    elif 'd' in key_data: target_base_lin = -LINEAR_SPEED
                    
                    # Flipper Control
                    # Shifts
                    speed_mult = 3.0 if '1;2' in key_data else 1.0
                    f_speed = FLIPPER_SPEED_RAD_S * speed_mult
                    
                    # Arrows (Escape sequences)
                    if 'A' in key_data: # Up (matches suffix of \x1b[A)
                        target_flipper_front_vel = f_speed
                    elif 'B' in key_data: # Down
                        target_flipper_front_vel = -f_speed
                        
                    if 'D' in key_data: # Left
                        target_flipper_back_vel = f_speed
                    elif 'C' in key_data: # Right
                        target_flipper_back_vel = -f_speed

                # Update State
                self.linear_vel = target_base_lin
                self.angular_vel = target_base_ang
                
                # Flipper Setpoint (Direct Velocity Control per User Request)
                # Matches WASD logic: Hold key = Set Value, Release = 0.0
                self.flipper_front_angle = target_flipper_front_vel
                self.flipper_back_angle = target_flipper_back_vel
                
                # Publish
                self.publish_state()
                
                # Small sleep to prevent 100% CPU if select returns fast? 
                # select waits up to 0.1s. If key held, returns immediately.
                # If returns immediately, loop runs at max speed?
                # Yes. We should cap loop rate to avoid busy spinning.
                # However, dt handles integration correctness.
                # But high CPU usage isn't ideal.
                time.sleep(0.01) 

        except Exception as e:
            print(e)
        finally:
            # Restore Settings
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.settings)
            
            # Send Stop
            self.linear_vel = 0.0
            self.angular_vel = 0.0
            self.publish_state()
            print("\nStopped.")

def main(args=None):
    rclpy.init(args=args)
    node = CombinedTeleop()
    node.run()
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
