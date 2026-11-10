#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from nav_msgs.msg import OccupancyGrid
import numpy as np
from PIL import Image
import sys
import os

class MapToGeoTiff(Node):
    def __init__(self):
        super().__init__('map_to_geotiff')
        self.subscription = self.create_subscription(
            OccupancyGrid,
            'map',
            self.map_callback,
            10)
        self.get_logger().info('Waiting for map on /map topic...')
        self.map_received = False

    def map_callback(self, msg):
        if self.map_received:
            return
        
        self.get_logger().info('Received map! Processing...')
        
        # Extract metadata
        width = msg.info.width
        height = msg.info.height
        resolution = msg.info.resolution
        origin_x = msg.info.origin.position.x
        origin_y = msg.info.origin.position.y
        
        # Process map data
        # Data is row-major order, starting from (0,0) which is bottom-left in ROS
        # 0-100: probability, -1: unknown
        data = np.array(msg.data, dtype=np.int8).reshape((height, width))
        
        # Convert to image format (0-255)
        # 0 (free) -> 255 (white)
        # 100 (occupied) -> 0 (black)
        # -1 (unknown) -> 127 (gray)
        
        img_data = np.zeros((height, width), dtype=np.uint8)
        img_data[data == -1] = 127
        img_data[data == 0] = 255
        img_data[data == 100] = 0
        # Map values 1-99 to grayscale if needed, but standard occupancy grid is usually 0, 100, -1
        
        # Create Image
        # ROS map origin is bottom-left. Image origin is top-left.
        # We need to flip the image vertically to match visual orientation if we just dump the array
        # because numpy 0,0 is top-left, but ROS data 0,0 corresponds to bottom-left physically?
        # Standard ROS Occupancy Grid: data[0] is (0,0) which is bottom-left.
        # If we reshape to (height, width), row 0 is the bottom row.
        # So we need to flip it to make it look "up is up" in an image viewer.
        
        img_data_flipped = np.flipud(img_data)
        
        img = Image.fromarray(img_data_flipped, mode='L')
        img.save('map.tiff')
        self.get_logger().info('Saved map.tiff')
        
        # Create World File (.tfw)
        # Line 1: x-scale (resolution)
        # Line 2: y-rotation (0)
        # Line 3: x-rotation (0)
        # Line 4: y-scale (-resolution because image y increases downwards, but map y increases upwards)
        # Line 5: x-coordinate of center of upper-left pixel
        # Line 6: y-coordinate of center of upper-left pixel
        
        # Upper-left pixel in image corresponds to (0, height-1) in grid coordinates (0-indexed)
        # Grid (0,0) is at origin_x, origin_y.
        # Grid (0, height-1) is at origin_x, origin_y + (height-1) * resolution
        # But we need center of pixel? Usually world files reference the center.
        # Center of (0,0) is origin_x + res/2, origin_y + res/2
        # Center of (0, height-1) is origin_x + res/2, origin_y + (height-1)*res + res/2
        
        # Let's verify standard TFW convention.
        # x_ul = origin_x + resolution / 2
        # y_ul = origin_y + (height * resolution) - (resolution / 2)
        
        x_scale = resolution
        y_rotation = 0.0
        x_rotation = 0.0
        y_scale = -resolution
        
        center_x_ul = origin_x + (resolution / 2.0)
        center_y_ul = origin_y + (height * resolution) - (resolution / 2.0)
        
        with open('map.tfw', 'w') as f:
            f.write(f"{x_scale}\n")
            f.write(f"{y_rotation}\n")
            f.write(f"{x_rotation}\n")
            f.write(f"{y_scale}\n")
            f.write(f"{center_x_ul}\n")
            f.write(f"{center_y_ul}\n")
            
        self.get_logger().info('Saved map.tfw')
        self.map_received = True
        sys.exit(0)

def main(args=None):
    rclpy.init(args=args)
    node = MapToGeoTiff()
    try:
        rclpy.spin(node)
    except SystemExit:
        rclpy.logging.get_logger('map_to_geotiff').info('Done.')
    except Exception as e:
        rclpy.logging.get_logger('map_to_geotiff').error(f'Error: {e}')
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
