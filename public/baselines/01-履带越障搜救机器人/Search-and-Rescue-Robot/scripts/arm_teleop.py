#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float64
import sys
import termios
import tty
import select

msg = """
Control Your Arm!
---------------------------
Moving around:
   1    2    3
   q    w    e

1/q : increase/decrease arm_one
2/w : increase/decrease arm_two
3/e : increase/decrease arm_three

r : reset all to 0

CTRL-C to quit
"""

class ArmTeleop(Node):
    def __init__(self):
        super().__init__('arm_teleop')
        
        self.pub_arm_one = self.create_publisher(Float64, '/cmd_arm_one', 10)
        self.pub_arm_two = self.create_publisher(Float64, '/cmd_arm_two', 10)
        self.pub_arm_three = self.create_publisher(Float64, '/cmd_arm_three', 10)
        
        self.arm_one_pos = 0.0
        self.arm_two_pos = 0.0
        self.arm_three_pos = 0.0
        self.step = 0.1
        
        self.settings = termios.tcgetattr(sys.stdin)

    def getKey(self):
        tty.setraw(sys.stdin.fileno())
        rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
        if rlist:
            key = sys.stdin.read(1)
        else:
            key = ''
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.settings)
        return key

    def pub_state(self):
        msg1 = Float64()
        msg1.data = self.arm_one_pos
        self.pub_arm_one.publish(msg1)
        
        msg2 = Float64()
        msg2.data = self.arm_two_pos
        self.pub_arm_two.publish(msg2)
        
        msg3 = Float64()
        msg3.data = self.arm_three_pos
        self.pub_arm_three.publish(msg3)
        
        print(f"\rPos: {self.arm_one_pos:.2f} | {self.arm_two_pos:.2f} | {self.arm_three_pos:.2f}", end='')

    def run(self):
        print(msg)
        try:
            while rclpy.ok():
                key = self.getKey()
                
                if key == '1':
                    self.arm_one_pos += self.step
                elif key == 'q':
                    self.arm_one_pos -= self.step
                elif key == '2':
                    self.arm_two_pos += self.step
                elif key == 'w':
                    self.arm_two_pos -= self.step
                elif key == '3':
                    self.arm_three_pos += self.step
                elif key == 'e':
                    self.arm_three_pos -= self.step
                elif key == 'r':
                    self.arm_one_pos = 0.0
                    self.arm_two_pos = 0.0
                    self.arm_three_pos = 0.0
                elif key == '\x03': # Ctrl-C
                    break
                
                self.pub_state()
                
        except Exception as e:
            print(e)
        finally:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.settings)

def main(args=None):
    rclpy.init(args=args)
    node = ArmTeleop()
    node.run()
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
