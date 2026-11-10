#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float64
import sys, select, termios, tty

msg = """
Control Your Flippers (Coupled)!
---------------------------
Front Flippers: t (up) / g (down)
Back Flippers:  y (up) / h (down)

0 : Reset all to 0.0 (Rest Position)
CTRL-C to quit
"""

# Map keys to (pair_name, direction_sign)
moveBindings = {
    't': ('front', 0.1), 'g': ('front', -0.1),
    'y': ('back', -0.1),  'h': ('back', 0.1),
}

def getKey(settings):
    tty.setraw(sys.stdin.fileno())
    select.select([sys.stdin], [], [], 0)
    key = sys.stdin.read(1)
    termios.tcsetattr(sys.stdin, termios.TCSADRAIN, settings)
    return key

class FlipperTeleop(Node):
    def __init__(self):
        super().__init__('flipper_teleop')
        
        # Publishers for all 4 flippers
        self.pub_FL = self.create_publisher(Float64, '/cmd_f_front_left', 10)
        self.pub_FR = self.create_publisher(Float64, '/cmd_f_front_right', 10)
        self.pub_BL = self.create_publisher(Float64, '/cmd_f_back_left', 10)
        self.pub_BR = self.create_publisher(Float64, '/cmd_f_back_right', 10)
        
        # Internal state stores angle for 'front' and 'back' pairs
        self.angles = {
            'front': 0.0,
            'back': 0.0
        }

    def publish_angles(self):
        # Publish front angle
        # Inverting Left side based on user report (Left moves Down when Right moves Up)
        msg_front_l = Float64()
        msg_front_l.data = -1.0 * self.angles['front'] 
        msg_front_r = Float64()
        msg_front_r.data = self.angles['front']
        
        self.pub_FL.publish(msg_front_l)
        self.pub_FR.publish(msg_front_r)
        
        # Publish back angle
        msg_back_l = Float64()
        msg_back_l.data = -1.0 * self.angles['back']
        msg_back_r = Float64()
        msg_back_r.data = self.angles['back']
        
        self.pub_BL.publish(msg_back_l)
        self.pub_BR.publish(msg_back_r)

    def print_status(self):
        print(f"\rFront: {self.angles['front']:.2f} | Back: {self.angles['back']:.2f}", end="")

    def update(self, key):
        if key in moveBindings.keys():
            pair, direction = moveBindings[key]
            self.angles[pair] += direction
            self.print_status()
            self.publish_angles()
            
        elif key == '0':
            self.angles['front'] = 0.0
            self.angles['back'] = 0.0
            print("\nResetting all flippers to 0.0")
            self.publish_angles()

def main():
    settings = termios.tcgetattr(sys.stdin)
    rclpy.init()
    node = FlipperTeleop()
    
    print(msg)
    
    try:
        while True:
            key = getKey(settings)
            if key == '\x03': # CTRL-C
                break
            node.update(key)
            
    except Exception as e:
        print(e)
        
    finally:
        # Try to publish 0 before quitting? No, just keep last position.
        node.destroy_node()
        rclpy.shutdown()
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, settings)

if __name__ == '__main__':
    main()
