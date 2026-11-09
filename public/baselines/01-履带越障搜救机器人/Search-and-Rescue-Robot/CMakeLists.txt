cmake_minimum_required(VERSION 3.8)
project(sar_urdf)

# Default to C++14
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 14)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Find dependencies
find_package(ament_cmake REQUIRED)

# Install directories
install(DIRECTORY
  config
  launch
  meshes
  models
  urdf
  DESTINATION share/${PROJECT_NAME}/
)

install(PROGRAMS
  scripts/flipper_control.py
  scripts/arm_teleop.py
  scripts/combined_teleop.py
  scripts/map_to_geotiff.py
  DESTINATION lib/${PROJECT_NAME}
)

ament_environment_hooks("${CMAKE_CURRENT_SOURCE_DIR}/env-hooks/sar_urdf.dsv.in")

ament_package()

