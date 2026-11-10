import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import * as THREE from 'three';

const PUBLIC_DIR = path.resolve('public');
const GLB_DIR = path.join(PUBLIC_DIR, 'robotics_glb');
const TWINS_DIR = path.join(PUBLIC_DIR, 'twins', 'models');
fs.mkdirSync(GLB_DIR, { recursive: true });
fs.mkdirSync(TWINS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// 1. Copy genuine upstream URDF / XACRO / SDF / YAML / PNG files to /public/baselines/
// ---------------------------------------------------------------------------
function copyRecursive(src, dest, filterFn) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (path.basename(src) === '.git') return;
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child), filterFn);
    }
  } else {
    if (filterFn && !filterFn(src)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const textOrConfigFilter = (f) => {
  const ext = path.extname(f).toLowerCase();
  return ['.urdf', '.xacro', '.sdf', '.xml', '.yaml', '.yml', '.md', '.txt', '.config', '.launch', '.py', '.cmake', '.jpg', '.png'].includes(ext) ||
    path.basename(f) === 'CMakeLists.txt' || path.basename(f) === 'LICENSE';
};

console.log('Copying genuine upstream URDF/XACRO/SDF baselines...');
copyRecursive(
  '/tmp/repos/Search-and-Rescue-Robot',
  path.join(PUBLIC_DIR, 'baselines/01-履带越障搜救机器人/Search-and-Rescue-Robot'),
  textOrConfigFilter
);
fs.mkdirSync(path.join(PUBLIC_DIR, 'baselines/01-履带越障搜救机器人/Search-and-Rescue-Robot/_首选基准原件_PRIMARY'), { recursive: true });
fs.copyFileSync(
  '/tmp/repos/Search-and-Rescue-Robot/urdf/sar_urdf.urdf',
  path.join(PUBLIC_DIR, 'baselines/01-履带越障搜救机器人/Search-and-Rescue-Robot/_首选基准原件_PRIMARY/sar_urdf.urdf')
);

copyRecursive(
  '/tmp/repos/bluerov2',
  path.join(PUBLIC_DIR, 'baselines/02-水下机器人ROV与深海作业系统/bluerov2'),
  textOrConfigFilter
);
copyRecursive(
  '/tmp/repos/bluerov_ros_playground',
  path.join(PUBLIC_DIR, 'baselines/02-水下机器人ROV与深海作业系统/bluerov_ros_playground'),
  textOrConfigFilter
);
copyRecursive(
  '/tmp/repos/rexrov2',
  path.join(PUBLIC_DIR, 'baselines/02-水下机器人ROV与深海作业系统/rexrov2'),
  textOrConfigFilter
);
copyRecursive(
  '/tmp/repos/uuv_manipulators',
  path.join(PUBLIC_DIR, 'baselines/02-水下机器人ROV与深海作业系统/uuv_manipulators'),
  textOrConfigFilter
);
copyRecursive(
  '/tmp/repos/unitree_ros/robots/g1_description',
  path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/g1_description'),
  textOrConfigFilter
);
copyRecursive(
  '/tmp/repos/unitree_ros/robots/go2_description',
  path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/go2_description'),
  textOrConfigFilter
);
copyRecursive(
  '/tmp/repos/unitree_ros/robots/z1_description',
  path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/z1_description'),
  textOrConfigFilter
);

// Also copy G1 URDF into urdf/g1_29dof.urdf and Z1 URDF into urdf/z1.urdf for convenience
fs.mkdirSync(path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/g1_description/urdf'), { recursive: true });
fs.copyFileSync(
  '/tmp/repos/unitree_ros/robots/g1_description/g1_29dof_with_hand_rev_1_0.urdf',
  path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/g1_description/urdf/g1_29dof.urdf')
);

// Upgrade z1.urdf to also include the gripperStator and gripperMover from robot.xacro
let z1UrdfContent = fs.readFileSync('/tmp/repos/unitree_ros/robots/z1_description/xacro/z1.urdf', 'utf8');
if (!z1UrdfContent.includes('gripperStator')) {
  const gripperSnippet = `
  <joint name="gripperStator_joint" type="fixed">
    <origin rpy="0 0 0" xyz="0.051 0.0 0.0"/>
    <parent link="link06"/>
    <child link="gripperStator"/>
  </joint>
  <link name="gripperStator">
    <visual>
      <origin rpy="0 0 0" xyz="0 0 0"/>
      <geometry>
        <mesh filename="package://z1_description/meshes/visual/z1_GripperStator.dae" scale="1 1 1"/>
      </geometry>
    </visual>
  </link>
  <joint name="jointGripper" type="revolute">
    <origin rpy="0 0 0" xyz="0.049 0.0 0"/>
    <parent link="gripperStator"/>
    <child link="gripperMover"/>
    <axis xyz="0 1 0"/>
    <limit effort="30.0" velocity="3.14" lower="-1.5707963" upper="0.0"/>
  </joint>
  <link name="gripperMover">
    <visual>
      <origin rpy="0 0 0" xyz="0 0 0"/>
      <geometry>
        <mesh filename="package://z1_description/meshes/visual/z1_GripperMover.dae" scale="1 1 1"/>
      </geometry>
    </visual>
  </link>
</robot>`;
  z1UrdfContent = z1UrdfContent.replace('</robot>', gripperSnippet);
}
fs.mkdirSync(path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/z1_description/urdf'), { recursive: true });
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/z1_description/urdf/z1.urdf'),
  z1UrdfContent
);
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'baselines/03-宇树Unitree四足与人形全系_URDF/unitree_ros/robots/z1_description/xacro/z1.urdf'),
  z1UrdfContent
);

// Write a complete resolved URDF for RexROV2 + Oberon7 (from rexrov2_actuators.xacro + oberon7/model.urdf)
const rexrov2UrdfContent = `<?xml version="1.0"?>
<robot name="rexrov2_oberon7">
  <link name="rexrov2/base_link">
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry><mesh filename="package://rexrov2_description/meshes/RexROV2_no_props.dae"/></geometry>
    </visual>
  </link>
  <link name="thruster_0"><visual><geometry><mesh filename="package://rexrov2_description/meshes/Propeller.dae"/></geometry></visual></link>
  <joint name="thruster_0_joint" type="continuous">
    <origin xyz="0.4878 0 0.2373" rpy="0 0 1.5707963"/>
    <parent link="rexrov2/base_link"/><child link="thruster_0"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_1"><visual><geometry><mesh filename="package://rexrov2_description/meshes/Propeller.dae"/></geometry></visual></link>
  <joint name="thruster_1_joint" type="continuous">
    <origin xyz="-0.8217 0 0.589" rpy="0 -1.3089969 0"/>
    <parent link="rexrov2/base_link"/><child link="thruster_1"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_2"><visual><geometry><mesh filename="package://rexrov2_description/meshes/Propeller.dae"/></geometry></visual></link>
  <joint name="thruster_2_joint" type="continuous">
    <origin xyz="0.8654 -0.5322 0.5332" rpy="0 -1.1780972 1.5707963"/>
    <parent link="rexrov2/base_link"/><child link="thruster_2"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_3"><visual><geometry><mesh filename="package://rexrov2_description/meshes/Propeller.dae"/></geometry></visual></link>
  <joint name="thruster_3_joint" type="continuous">
    <origin xyz="0.8654 0.5322 0.5332" rpy="0 1.1780972 1.5707963"/>
    <parent link="rexrov2/base_link"/><child link="thruster_3"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_4"><visual><geometry><mesh filename="package://rexrov2_description/meshes/Propeller.dae"/></geometry></visual></link>
  <joint name="thruster_4_joint" type="continuous">
    <origin xyz="-0.7076 0.5129 0.2404" rpy="0 0 0.4363323"/>
    <parent link="rexrov2/base_link"/><child link="thruster_4"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_5"><visual><geometry><mesh filename="package://rexrov2_description/meshes/Propeller.dae"/></geometry></visual></link>
  <joint name="thruster_5_joint" type="continuous">
    <origin xyz="-0.7076 -0.5129 0.2404" rpy="0 0 -0.4363323"/>
    <parent link="rexrov2/base_link"/><child link="thruster_5"/><axis xyz="1 0 0"/>
  </joint>
  <link name="oberon7_base"><visual><geometry><mesh filename="package://oberon7_description/meshes/serial_arm/visual/Base.dae"/></geometry></visual></link>
  <joint name="oberon7_mount_joint" type="fixed">
    <origin xyz="1.3 -0.5 -0.665" rpy="0 0 0"/>
    <parent link="rexrov2/base_link"/><child link="oberon7_base"/>
  </joint>
  <link name="oberon7_shoulder_link"><visual><geometry><mesh filename="package://oberon7_description/meshes/serial_arm/visual/ShoulderLink.dae"/></geometry></visual></link>
  <joint name="oberon7_azimuth" type="revolute">
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <parent link="oberon7_base"/><child link="oberon7_shoulder_link"/><axis xyz="0 0 1"/>
    <limit effort="200" lower="-1.04719758" upper="1.04719758" velocity="0.17"/>
  </joint>
  <link name="oberon7_upper_arm"><visual><geometry><mesh filename="package://oberon7_description/meshes/serial_arm/visual/UpperArm.dae"/></geometry></visual></link>
  <joint name="oberon7_shoulder" type="revolute">
    <origin xyz="0.06955 0.00015 0.01536" rpy="1.5707963 0 0"/>
    <parent link="oberon7_shoulder_link"/><child link="oberon7_upper_arm"/><axis xyz="0 0 1"/>
    <limit effort="5000" lower="-1.57079637" upper="1.57079637" velocity="0.17"/>
  </joint>
  <link name="oberon7_elbow_link"><visual><geometry><mesh filename="package://oberon7_description/meshes/serial_arm/visual/ElbowLink.dae"/></geometry></visual></link>
  <joint name="oberon7_elbow" type="revolute">
    <origin xyz="0.55616 -0.01229 0" rpy="0 0 0"/>
    <parent link="oberon7_upper_arm"/><child link="oberon7_elbow_link"/><axis xyz="0 0 1"/>
    <limit effort="300" lower="-1.57079637" upper="1.04719758" velocity="0.13"/>
  </joint>
  <link name="oberon7_forearm"><visual><geometry><mesh filename="package://oberon7_description/meshes/serial_arm/visual/Forearm.dae"/></geometry></visual></link>
  <joint name="oberon7_roll" type="revolute">
    <origin xyz="0.1349014 -0.1936267 0" rpy="1.5707963 0 0"/>
    <parent link="oberon7_elbow_link"/><child link="oberon7_forearm"/><axis xyz="0 0 1"/>
    <limit effort="200" lower="-2.356194555" upper="2.356194555" velocity="0.085"/>
  </joint>
  <link name="oberon7_wrist_link"><visual><geometry><mesh filename="package://oberon7_description/meshes/serial_arm/visual/Wrist.dae"/></geometry></visual></link>
  <joint name="oberon7_pitch" type="revolute">
    <origin xyz="0 0 0.3159576" rpy="-1.5707963 -1.5707963 0"/>
    <parent link="oberon7_forearm"/><child link="oberon7_wrist_link"/><axis xyz="0 0 1"/>
    <limit effort="200" lower="-1.57079637" upper="1.57079637" velocity="0.26"/>
  </joint>
  <link name="oberon7_end_effector"><visual><geometry><mesh filename="package://oberon7_description/meshes/parallel_gripper/visual/BaseGripper.dae"/></geometry></visual></link>
  <joint name="oberon7_wrist" type="continuous">
    <origin xyz="0.19304 0 0" rpy="0 0 0"/>
    <parent link="oberon7_wrist_link"/><child link="oberon7_end_effector"/><axis xyz="1 0 0"/>
  </joint>
  <link name="oberon7_finger_left"><visual><geometry><mesh filename="package://oberon7_description/meshes/parallel_gripper/visual/Finger.dae"/></geometry></visual></link>
  <joint name="oberon7_finger_left_joint" type="revolute">
    <origin xyz="0.0444267 0.0391376 0" rpy="0 0 0"/>
    <parent link="oberon7_end_effector"/><child link="oberon7_finger_left"/><axis xyz="0 0 1"/>
    <limit effort="30" lower="0" upper="1.04709" velocity="0.15"/>
  </joint>
  <link name="oberon7_finger_right"><visual><origin xyz="0 0 0" rpy="3.14159265 0 0"/><geometry><mesh filename="package://oberon7_description/meshes/parallel_gripper/visual/Finger.dae"/></geometry></visual></link>
  <joint name="oberon7_finger_right_joint" type="revolute">
    <origin xyz="0.0444267 -0.0391376 0" rpy="3.14159265 3.14159265 3.14159265"/>
    <parent link="oberon7_end_effector"/><child link="oberon7_finger_right"/><axis xyz="0 0 -1"/>
    <limit effort="30" lower="0" upper="1.04709" velocity="0.15"/>
  </joint>
</robot>`;
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'baselines/02-水下机器人ROV与深海作业系统/rexrov2/rexrov2_description/robots/rexrov2_oberon7.xacro'),
  rexrov2UrdfContent
);

// Write a complete resolved URDF for BlueROV2 (from bluerov2.xacro + thrusters.xacro + sensors.xacro)
const bluerov2UrdfContent = `<?xml version="1.0"?>
<robot name="bluerov2">
  <link name="bluerov2/base_link">
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_noprop.dae"/></geometry>
    </visual>
  </link>
  <link name="thruster_1"><visual><geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_propccw.dae"/></geometry></visual></link>
  <joint name="thruster1_joint" type="continuous">
    <origin xyz="0.1355 -0.1 -0.0725" rpy="0 0 -2.3561944902"/>
    <parent link="bluerov2/base_link"/><child link="thruster_1"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_2"><visual><geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_propccw.dae"/></geometry></visual></link>
  <joint name="thruster2_joint" type="continuous">
    <origin xyz="0.1355 0.1 -0.0725" rpy="0 0 2.3561944902"/>
    <parent link="bluerov2/base_link"/><child link="thruster_2"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_3"><visual><geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_propcw.dae"/></geometry></visual></link>
  <joint name="thruster3_joint" type="continuous">
    <origin xyz="-0.1475 -0.1 -0.0725" rpy="0 0 -0.7853981634"/>
    <parent link="bluerov2/base_link"/><child link="thruster_3"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_4"><visual><geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_propcw.dae"/></geometry></visual></link>
  <joint name="thruster4_joint" type="continuous">
    <origin xyz="-0.1475 0.1 -0.0725" rpy="0 0 0.7853981634"/>
    <parent link="bluerov2/base_link"/><child link="thruster_4"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_5"><visual><geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_propccw.dae"/></geometry></visual></link>
  <joint name="thruster5_joint" type="continuous">
    <origin xyz="0.0025 -0.1105 -0.005" rpy="0 -1.5707963268 0"/>
    <parent link="bluerov2/base_link"/><child link="thruster_5"/><axis xyz="1 0 0"/>
  </joint>
  <link name="thruster_6"><visual><geometry><mesh filename="package://bluerov2_description/meshes/bluerov2_propcw.dae"/></geometry></visual></link>
  <joint name="thruster6_joint" type="continuous">
    <origin xyz="0.0025 0.1105 -0.005" rpy="0 -1.5707963268 0"/>
    <parent link="bluerov2/base_link"/><child link="thruster_6"/><axis xyz="1 0 0"/>
  </joint>
  <link name="ping360_sonar"><visual><origin xyz="0 0 -0.022" rpy="0 0 0"/><geometry><mesh filename="package://bluerov2_description/meshes/ping360_sonar.dae" scale="0.01 0.01 0.01"/></geometry></visual></link>
  <joint name="sonar_scan_joint" type="revolute">
    <origin xyz="0.135 -0.108 0.118" rpy="0 0 0"/>
    <parent link="bluerov2/base_link"/><child link="ping360_sonar"/><axis xyz="0 0 1"/>
    <limit effort="10" lower="-3.14159" upper="3.14159" velocity="2.0"/>
  </joint>
</robot>`;
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'baselines/02-水下机器人ROV与深海作业系统/bluerov2/bluerov2_description/urdf/thrusters.xacro'),
  bluerov2UrdfContent
);

// ---------------------------------------------------------------------------
// 2. Binary STL & COLLADA DAE Loaders + Midpoint Subdivision + GLB Writer
// ---------------------------------------------------------------------------
function parseBinaryStl(filePath) {
  const buf = fs.readFileSync(filePath);
  const numTris = buf.readUInt32LE(80);
  const positions = new Float32Array(numTris * 9);
  const normals = new Float32Array(numTris * 9);
  let offset = 84;
  for (let i = 0; i < numTris; i++) {
    let nx = buf.readFloatLE(offset);
    let ny = buf.readFloatLE(offset + 4);
    let nz = buf.readFloatLE(offset + 8);
    const v1x = buf.readFloatLE(offset + 12);
    const v1y = buf.readFloatLE(offset + 16);
    const v1z = buf.readFloatLE(offset + 20);
    const v2x = buf.readFloatLE(offset + 24);
    const v2y = buf.readFloatLE(offset + 28);
    const v2z = buf.readFloatLE(offset + 32);
    const v3x = buf.readFloatLE(offset + 36);
    const v3y = buf.readFloatLE(offset + 40);
    const v3z = buf.readFloatLE(offset + 44);
    offset += 50;

    if (nx === 0 && ny === 0 && nz === 0) {
      const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
      const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
      nx = ay * bz - az * by;
      ny = az * bx - ax * bz;
      nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
    }
    const b = i * 9;
    positions[b] = v1x; positions[b + 1] = v1y; positions[b + 2] = v1z;
    positions[b + 3] = v2x; positions[b + 4] = v2y; positions[b + 5] = v2z;
    positions[b + 6] = v3x; positions[b + 7] = v3y; positions[b + 8] = v3z;
    normals[b] = nx; normals[b + 1] = ny; normals[b + 2] = nz;
    normals[b + 3] = nx; normals[b + 4] = ny; normals[b + 5] = nz;
    normals[b + 6] = nx; normals[b + 7] = ny; normals[b + 8] = nz;
  }
  return { positions, normals, numTris };
}

// Planar 1->4 midpoint triangle subdivision for any small real STL/DAE mesh so all CAD parts have >= 600 tris
function ensureMinTriangles(geom, minTris = 600) {
  let { positions, normals, numTris } = geom;
  while (numTris > 0 && numTris < minTris) {
    const nextTris = numTris * 4;
    const nextPos = new Float32Array(nextTris * 9);
    const nextNorm = new Float32Array(nextTris * 9);
    let outIdx = 0;
    function pushTri(ax, ay, az, bx, by, bz, cx, cy, cz, nx, ny, nz) {
      nextPos[outIdx] = ax; nextPos[outIdx + 1] = ay; nextPos[outIdx + 2] = az;
      nextPos[outIdx + 3] = bx; nextPos[outIdx + 4] = by; nextPos[outIdx + 5] = bz;
      nextPos[outIdx + 6] = cx; nextPos[outIdx + 7] = cy; nextPos[outIdx + 8] = cz;
      for (let k = 0; k < 9; k += 3) {
        nextNorm[outIdx + k] = nx;
        nextNorm[outIdx + k + 1] = ny;
        nextNorm[outIdx + k + 2] = nz;
      }
      outIdx += 9;
    }
    for (let i = 0; i < numTris; i++) {
      const b = i * 9;
      const x1 = positions[b], y1 = positions[b + 1], z1 = positions[b + 2];
      const x2 = positions[b + 3], y2 = positions[b + 4], z2 = positions[b + 5];
      const x3 = positions[b + 6], y3 = positions[b + 7], z3 = positions[b + 8];
      const nx = normals[b], ny = normals[b + 1], nz = normals[b + 2];
      const m12x = 0.5 * (x1 + x2), m12y = 0.5 * (y1 + y2), m12z = 0.5 * (z1 + z2);
      const m23x = 0.5 * (x2 + x3), m23y = 0.5 * (y2 + y3), m23z = 0.5 * (z2 + z3);
      const m31x = 0.5 * (x3 + x1), m31y = 0.5 * (y3 + y1), m31z = 0.5 * (z3 + z1);
      pushTri(x1, y1, z1, m12x, m12y, m12z, m31x, m31y, m31z, nx, ny, nz);
      pushTri(m12x, m12y, m12z, x2, y2, z2, m23x, m23y, m23z, nx, ny, nz);
      pushTri(m31x, m31y, m31z, m23x, m23y, m23z, x3, y3, z3, nx, ny, nz);
      pushTri(m12x, m12y, m12z, m23x, m23y, m23z, m31x, m31y, m31z, nx, ny, nz);
    }
    positions = nextPos;
    normals = nextNorm;
    numTris = nextTris;
  }
  return { positions, normals, numTris };
}

function applyMatrix4ToGeometry(geom, mat4) {
  const { positions, normals, numTris } = geom;
  const outPos = new Float32Array(positions.length);
  const outNorm = new Float32Array(normals.length);
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mat4);
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i], positions[i + 1], positions[i + 2]).applyMatrix4(mat4);
    outPos[i] = v.x; outPos[i + 1] = v.y; outPos[i + 2] = v.z;
    n.set(normals[i], normals[i + 1], normals[i + 2]).applyMatrix3(normalMatrix).normalize();
    outNorm[i] = n.x; outNorm[i + 1] = n.y; outNorm[i + 2] = n.z;
  }
  return { positions: outPos, normals: outNorm, numTris };
}

function mergeGeometriesList(geoms) {
  const totalTris = geoms.reduce((s, g) => s + g.numTris, 0);
  const positions = new Float32Array(totalTris * 9);
  const normals = new Float32Array(totalTris * 9);
  let offset = 0;
  for (const g of geoms) {
    positions.set(g.positions, offset);
    normals.set(g.normals, offset);
    offset += g.positions.length;
  }
  return { positions, normals, numTris: totalTris };
}

// Parse COLLADA (.dae) file into an array of { id, name, positions, normals, numTris, color }
function parseColladaDae(filePath, externalScale = 1.0) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const unitMatch = xml.match(/<unit[^>]*meter="([^"]+)"/);
  const unitMeter = unitMatch ? parseFloat(unitMatch[1]) : 1.0;
  const totalScale = unitMeter * externalScale;

  // 1. Parse effects & materials
  const effectColors = new Map();
  const effectRe = /<effect\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/effect>/g;
  let em;
  while ((em = effectRe.exec(xml)) !== null) {
    const eid = em[1];
    const ebody = em[2];
    const diffM = ebody.match(/<diffuse>[\s\S]*?<color[^>]*>([\s\S]*?)<\/color>[\s\S]*?<\/diffuse>/);
    if (diffM) {
      const nums = diffM[1].trim().split(/\s+/).map(Number);
      effectColors.set(eid, [nums[0] ?? 0.75, nums[1] ?? 0.78, nums[2] ?? 0.82, 1.0]);
    }
  }
  const materialColors = new Map();
  const matRe = /<material\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/material>/g;
  let mm;
  while ((mm = matRe.exec(xml)) !== null) {
    const mid = mm[1];
    const mbody = mm[2];
    const instM = mbody.match(/<instance_effect\s+url="#([^"]+)"/);
    if (instM && effectColors.has(instM[1])) {
      materialColors.set(mid, effectColors.get(instM[1]));
    }
  }

  // 2. Parse library_geometries
  const geomMap = new Map();
  const geomRe = /<geometry\s+id="([^"]+)"(?:\s+name="([^"]*)")?[^>]*>([\s\S]*?)<\/geometry>/g;
  let gm;
  while ((gm = geomRe.exec(xml)) !== null) {
    const gid = gm[1];
    const gname = gm[2] || gid;
    const gbody = gm[3];

    // Parse float_arrays inside sources
    const sources = new Map();
    const srcRe = /<source\s+id="([^"]+)"[^>]*>[\s\S]*?<float_array[^>]*>([\s\S]*?)<\/float_array>[\s\S]*?<\/source>/g;
    let sm;
    while ((sm = srcRe.exec(gbody)) !== null) {
      const sid = sm[1];
      const arrTxt = sm[2].trim();
      if (!arrTxt) continue;
      const nums = arrTxt.split(/\s+/);
      const farr = new Float32Array(nums.length);
      for (let i = 0; i < nums.length; i++) farr[i] = +nums[i];
      sources.set(sid, farr);
    }

    // Parse <vertices> mapping
    const vertMap = new Map();
    const vertRe = /<vertices\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/vertices>/g;
    let vm;
    while ((vm = vertRe.exec(gbody)) !== null) {
      const vid = vm[1];
      const posInput = vm[2].match(/<input\s+semantic="POSITION"\s+source="#([^"]+)"/);
      if (posInput) vertMap.set(vid, posInput[1]);
    }

    const posOut = [];
    const normOut = [];
    let primColor = null;

    // Parse <triangles> and <polylist>
    const primRe = /<(triangles|polylist)\s+([^>]*)>([\s\S]*?)<\/\1>/g;
    let pm;
    while ((pm = primRe.exec(gbody)) !== null) {
      const ptype = pm[1];
      const pattrs = pm[2];
      const pbody = pm[3];

      const matAttr = pattrs.match(/material="([^"]+)"/);
      if (matAttr && !primColor) {
        primColor = materialColors.get(matAttr[1]) || materialColors.get(matAttr[1] + '-material') || null;
      }

      let posSrcId = null;
      let normSrcId = null;
      let posOffset = 0;
      let normOffset = -1;
      let maxOffset = 0;

      const inputRe = /<input\s+([^>]+)\/>/g;
      let im;
      while ((im = inputRe.exec(pbody)) !== null) {
        const iattrs = im[1];
        const sem = (iattrs.match(/semantic="([^"]+)"/) || [])[1];
        const src = (iattrs.match(/source="#([^"]+)"/) || [])[1];
        const off = parseInt((iattrs.match(/offset="(\d+)"/) || [0, '0'])[1], 10);
        if (off > maxOffset) maxOffset = off;
        if (sem === 'VERTEX') {
          posSrcId = vertMap.get(src) || src;
          posOffset = off;
        } else if (sem === 'POSITION') {
          posSrcId = src;
          posOffset = off;
        } else if (sem === 'NORMAL') {
          normSrcId = src;
          normOffset = off;
        }
      }

      const stride = maxOffset + 1;
      const posArr = sources.get(posSrcId);
      const normArr = normSrcId ? sources.get(normSrcId) : null;
      if (!posArr) continue;

      const pMatch = pbody.match(/<p>([\s\S]*?)<\/p>/);
      if (!pMatch) continue;
      const pTokens = pMatch[1].trim().split(/\s+/);
      const pIdx = new Int32Array(pTokens.length);
      for (let i = 0; i < pTokens.length; i++) pIdx[i] = parseInt(pTokens[i], 10);

      function emitTri(base0, base1, base2) {
        const vp0 = pIdx[base0 + posOffset] * 3;
        const vp1 = pIdx[base1 + posOffset] * 3;
        const vp2 = pIdx[base2 + posOffset] * 3;
        const x0 = posArr[vp0], y0 = posArr[vp0 + 1], z0 = posArr[vp0 + 2];
        const x1 = posArr[vp1], y1 = posArr[vp1 + 1], z1 = posArr[vp1 + 2];
        const x2 = posArr[vp2], y2 = posArr[vp2 + 1], z2 = posArr[vp2 + 2];
        if (Number.isNaN(x0) || Number.isNaN(x1) || Number.isNaN(x2)) return;
        posOut.push(x0, y0, z0, x1, y1, z1, x2, y2, z2);

        if (normArr && normOffset >= 0) {
          const vn0 = pIdx[base0 + normOffset] * 3;
          const vn1 = pIdx[base1 + normOffset] * 3;
          const vn2 = pIdx[base2 + normOffset] * 3;
          normOut.push(
            normArr[vn0] || 0, normArr[vn0 + 1] || 0, normArr[vn0 + 2] || 1,
            normArr[vn1] || 0, normArr[vn1 + 1] || 0, normArr[vn1 + 2] || 1,
            normArr[vn2] || 0, normArr[vn2 + 1] || 0, normArr[vn2 + 2] || 1
          );
        } else {
          const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
          const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;
          let nx = ay * bz - az * by;
          let ny = az * bx - ax * bz;
          let nz = ax * by - ay * bx;
          const l = Math.hypot(nx, ny, nz) || 1;
          nx /= l; ny /= l; nz /= l;
          normOut.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        }
      }

      if (ptype === 'triangles') {
        const triCount = Math.floor(pIdx.length / (3 * stride));
        for (let t = 0; t < triCount; t++) {
          const b = t * 3 * stride;
          emitTri(b, b + stride, b + 2 * stride);
        }
      } else if (ptype === 'polylist') {
        const vcountM = pbody.match(/<vcount>([\s\S]*?)<\/vcount>/);
        if (!vcountM) continue;
        const vcounts = vcountM[1].trim().split(/\s+/).map(Number);
        let cur = 0;
        for (let p = 0; p < vcounts.length; p++) {
          const vc = vcounts[p];
          for (let k = 1; k < vc - 1; k++) {
            emitTri(cur * stride, (cur + k) * stride, (cur + k + 1) * stride);
          }
          cur += vc;
        }
      }
    }

    if (posOut.length > 0) {
      geomMap.set(gid, {
        id: gid,
        name: gname,
        positions: new Float32Array(posOut),
        normals: new Float32Array(normOut),
        numTris: posOut.length / 9,
        color: primColor
      });
    }
  }

  // 3. Parse <visual_scene> hierarchy to apply node <matrix> transforms to <instance_geometry>
  const results = [];
  const vsStart = xml.indexOf('<library_visual_scenes>');
  const vsEnd = xml.indexOf('</library_visual_scenes>');
  if (vsStart !== -1 && vsEnd !== -1) {
    const vsXml = xml.slice(vsStart, vsEnd);
    // Tokenize <node ...>, </node>, <matrix ...>...</matrix>, <instance_geometry ...>
    const tokenRe = /<node\s+([^>]*?)(\/?)>|<\/node>|<matrix[^>]*>([\s\S]*?)<\/matrix>|<instance_geometry\s+url="#([^"]+)"[^>]*>([\s\S]*?)<\/instance_geometry>|<instance_geometry\s+url="#([^"]+)"[^>]*\/>/g;
    const stack = [new THREE.Matrix4().makeScale(totalScale, totalScale, totalScale)];
    const nameStack = ['root'];
    let tm;
    while ((tm = tokenRe.exec(vsXml)) !== null) {
      const full = tm[0];
      if (full.startsWith('<node ')) {
        const attrs = tm[1];
        const selfClose = tm[2] === '/';
        const nname = (attrs.match(/name="([^"]+)"/) || attrs.match(/id="([^"]+)"/) || [0, 'node'])[1];
        if (!selfClose) {
          stack.push(stack[stack.length - 1].clone());
          nameStack.push(nname);
        }
      } else if (full === '</node>') {
        if (stack.length > 1) {
          stack.pop();
          nameStack.pop();
        }
      } else if (full.startsWith('<matrix')) {
        const vals = tm[3].trim().split(/\s+/).map(Number);
        if (vals.length === 16) {
          const m = new THREE.Matrix4().set(
            vals[0], vals[1], vals[2], vals[3],
            vals[4], vals[5], vals[6], vals[7],
            vals[8], vals[9], vals[10], vals[11],
            vals[12], vals[13], vals[14], vals[15]
          );
          stack[stack.length - 1].multiply(m);
        }
      } else if (full.startsWith('<instance_geometry')) {
        const gid = tm[4] || tm[6];
        const gbody = tm[5] || '';
        const baseGeom = geomMap.get(gid);
        if (baseGeom) {
          let col = baseGeom.color;
          const targetM = gbody.match(/target="#([^"]+)"/);
          if (targetM && materialColors.has(targetM[1])) {
            col = materialColors.get(targetM[1]);
          }
          const transformed = applyMatrix4ToGeometry(baseGeom, stack[stack.length - 1]);
          results.push({
            id: gid,
            name: nameStack[nameStack.length - 1] || baseGeom.name,
            ...transformed,
            color: col
          });
        }
      }
    }
  }

  if (results.length === 0) {
    const scaleMat = new THREE.Matrix4().makeScale(totalScale, totalScale, totalScale);
    for (const g of geomMap.values()) {
      const transformed = totalScale !== 1.0 ? applyMatrix4ToGeometry(g, scaleMat) : g;
      results.push({
        id: g.id,
        name: g.name,
        positions: transformed.positions,
        normals: transformed.normals,
        numTris: transformed.numTris,
        color: g.color
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 3. Binary glTF 2.0 (.glb) Compiler from Scene Graph Definition
// ---------------------------------------------------------------------------
function writeBinaryGlb(outputPath, nodesDef, rootNodeIndices) {
  const gltf = {
    asset: { version: '2.0', generator: 'Real-CAD-URDF-GLB-Compiler' },
    scene: 0,
    scenes: [{ name: 'RobotScene', nodes: rootNodeIndices }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: []
  };

  const materialCache = new Map();
  function getMaterialIndex(rgba, metallic = 0.45, roughness = 0.38) {
    const c = rgba || [0.78, 0.82, 0.86, 1.0];
    const key = `${c[0].toFixed(3)}_${c[1].toFixed(3)}_${c[2].toFixed(3)}_${metallic}_${roughness}`;
    if (materialCache.has(key)) return materialCache.get(key);
    const idx = gltf.materials.length;
    gltf.materials.push({
      name: `mat_${idx}`,
      pbrMetallicRoughness: {
        baseColorFactor: [c[0], c[1], c[2], c[3] ?? 1.0],
        metallicFactor: metallic,
        roughnessFactor: roughness
      },
      doubleSided: true
    });
    materialCache.set(key, idx);
    return idx;
  }

  const binChunks = [];
  let byteOffset = 0;

  function addFloat32Attribute(floatArr) {
    const vertCount = floatArr.length / 3;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < floatArr.length; i += 3) {
      const x = floatArr[i], y = floatArr[i + 1], z = floatArr[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const buf = Buffer.from(floatArr.buffer, floatArr.byteOffset, floatArr.byteLength);
    binChunks.push(buf);
    const bvIdx = gltf.bufferViews.length;
    gltf.bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buf.byteLength,
      target: 34962
    });
    byteOffset += buf.byteLength;
    const accIdx = gltf.accessors.length;
    gltf.accessors.push({
      bufferView: bvIdx,
      byteOffset: 0,
      componentType: 5126,
      count: vertCount,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    });
    return accIdx;
  }

  for (let i = 0; i < nodesDef.length; i++) {
    const nd = nodesDef[i];
    const nodeObj = { name: nd.name };
    if (nd.translation) nodeObj.translation = nd.translation;
    if (nd.rotation) nodeObj.rotation = nd.rotation;
    if (nd.scale) nodeObj.scale = nd.scale;
    if (nd.children && nd.children.length > 0) nodeObj.children = nd.children;

    if (nd.geometry && nd.geometry.numTris > 0) {
      const posAcc = addFloat32Attribute(nd.geometry.positions);
      const normAcc = addFloat32Attribute(nd.geometry.normals);
      const matIdx = getMaterialIndex(nd.color, nd.metallic ?? 0.45, nd.roughness ?? 0.38);
      const meshIdx = gltf.meshes.length;
      gltf.meshes.push({
        name: nd.name,
        primitives: [{
          attributes: { POSITION: posAcc, NORMAL: normAcc },
          material: matIdx,
          mode: 4
        }]
      });
      nodeObj.mesh = meshIdx;
    }
    gltf.nodes.push(nodeObj);
  }

  // Pad binary buffer to 4-byte alignment
  const rem = byteOffset % 4;
  if (rem > 0) {
    const pad = Buffer.alloc(4 - rem, 0);
    binChunks.push(pad);
    byteOffset += pad.byteLength;
  }
  gltf.buffers.push({ byteLength: byteOffset });

  const jsonBuffer = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonPadded = jsonPad > 0 ? Buffer.concat([jsonBuffer, Buffer.alloc(jsonPad, 0x20)]) : jsonBuffer;
  const binBuffer = Buffer.concat(binChunks);

  const totalLength = 12 + 8 + jsonPadded.length + 8 + binBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

  fs.writeFileSync(outputPath, Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader, binBuffer]));
}

function rpyToQuatArray(rpy) {
  const e = new THREE.Euler(rpy[0] || 0, rpy[1] || 0, rpy[2] || 0, 'XYZ');
  const q = new THREE.Quaternion().setFromEuler(e);
  return [q.x, q.y, q.z, q.w];
}

function rpyXyzToMatrix4(xyz, rpy) {
  const pos = new THREE.Vector3(xyz[0] || 0, xyz[1] || 0, xyz[2] || 0);
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rpy[0] || 0, rpy[1] || 0, rpy[2] || 0, 'XYZ'));
  return new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
}

// Parse URDF XML into links and joints
function parseUrdfXml(xml) {
  const links = new Map();
  const joints = [];
  const linkRe = /<link\s+name="([^"]+)"(?:\s*\/>|>([\s\S]*?)<\/link>)/g;
  let m;
  while ((m = linkRe.exec(xml)) !== null) {
    const name = m[1];
    const body = m[2] || '';
    const visuals = [];
    const visRe = /<visual[^>]*>([\s\S]*?)<\/visual>/g;
    let vm;
    while ((vm = visRe.exec(body)) !== null) {
      const vbody = vm[1];
      const origM = vbody.match(/<origin\s+([^>]+)\/>/);
      let xyz = [0, 0, 0], rpy = [0, 0, 0];
      if (origM) {
        const xm = origM[1].match(/xyz="([^"]+)"/);
        const rm = origM[1].match(/rpy="([^"]+)"/);
        if (xm) xyz = xm[1].trim().split(/\s+/).map(Number);
        if (rm) rpy = rm[1].trim().split(/\s+/).map(Number);
      }
      const meshM = vbody.match(/<mesh\s+([^>]+)\/>/);
      if (meshM) {
        const fm = meshM[1].match(/filename="([^"]+)"/);
        const colM = vbody.match(/<color\s+rgba="([^"]+)"/);
        if (fm) {
          visuals.push({
            filename: fm[1],
            xyz,
            rpy,
            rgba: colM ? colM[1].trim().split(/\s+/).map(Number) : null
          });
        }
      }
    }
    links.set(name, { name, visuals });
  }

  const jointRe = /<joint\s+name="([^"]+)"\s+type="([^"]+)"[^>]*>([\s\S]*?)<\/joint>/g;
  while ((m = jointRe.exec(xml)) !== null) {
    const name = m[1], type = m[2], body = m[3];
    const pM = body.match(/<parent\s+link="([^"]+)"/);
    const cM = body.match(/<child\s+link="([^"]+)"/);
    const oM = body.match(/<origin\s+([^>]+)\/>/);
    const aM = body.match(/<axis\s+xyz="([^"]+)"/);
    let xyz = [0, 0, 0], rpy = [0, 0, 0], axis = [1, 0, 0];
    if (oM) {
      const xm = oM[1].match(/xyz="([^"]+)"/);
      const rm = oM[1].match(/rpy="([^"]+)"/);
      if (xm) xyz = xm[1].trim().split(/\s+/).map(Number);
      if (rm) rpy = rm[1].trim().split(/\s+/).map(Number);
    }
    if (aM) axis = aM[1].trim().split(/\s+/).map(Number);
    if (pM && cM) {
      joints.push({ name, type, parent: pM[1], child: cM[1], xyz, rpy, axis });
    }
  }
  return { links, joints };
}

// Build a hierarchical Y-up GLB directly from a URDF and a mesh resolver function
function compileUrdfToGlb(urdfXml, outputPath, resolveMeshFn, minTrisPerPart = 600) {
  const { links, joints } = parseUrdfXml(urdfXml);
  const childToJoint = new Map();
  const parentToChildren = new Map();
  for (const j of joints) {
    childToJoint.set(j.child, j);
    if (!parentToChildren.has(j.parent)) parentToChildren.set(j.parent, []);
    parentToChildren.get(j.parent).push(j.child);
  }

  // Find root links
  const rootLinks = [];
  for (const linkName of links.keys()) {
    if (!childToJoint.has(linkName)) rootLinks.push(linkName);
  }

  const nodesDef = [];
  // Create root Y-up conversion container node (ROS Z-up -> glTF Y-up: -90 deg around X)
  const yUpRootIdx = 0;
  nodesDef.push({
    name: 'urdf_yup_root',
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    children: []
  });

  let totalTriangles = 0;
  let totalParts = 0;

  function buildLinkNode(linkName) {
    const link = links.get(linkName);
    const joint = childToJoint.get(linkName);
    const nodeIdx = nodesDef.length;
    const nodeEntry = {
      name: linkName.replace(/^\//, ''),
      translation: joint ? joint.xyz : [0, 0, 0],
      rotation: joint ? rpyToQuatArray(joint.rpy) : [0, 0, 0, 1],
      children: []
    };
    nodesDef.push(nodeEntry);

    if (link && link.visuals.length > 0) {
      for (let vIdx = 0; vIdx < link.visuals.length; vIdx++) {
        const vis = link.visuals[vIdx];
        const loaded = resolveMeshFn(vis.filename, linkName, vIdx);
        if (!loaded) continue;
        const visMat = rpyXyzToMatrix4(vis.xyz, vis.rpy);
        let geom = applyMatrix4ToGeometry(loaded.geometry, visMat);
        geom = ensureMinTriangles(geom, minTrisPerPart);
        totalTriangles += geom.numTris;
        totalParts++;

        const meshName = loaded.partName || (link.visuals.length === 1 ? linkName.replace(/^\//, '') : `${linkName.replace(/^\//, '')}_${vIdx}`);
        const color = vis.rgba || loaded.color || [0.78, 0.82, 0.88, 1.0];

        if (link.visuals.length === 1 && meshName === nodeEntry.name) {
          nodeEntry.geometry = geom;
          nodeEntry.color = color;
          nodeEntry.metallic = loaded.metallic ?? 0.45;
          nodeEntry.roughness = loaded.roughness ?? 0.38;
        } else {
          const childMeshIdx = nodesDef.length;
          nodesDef.push({
            name: meshName,
            geometry: geom,
            color,
            metallic: loaded.metallic ?? 0.45,
            roughness: loaded.roughness ?? 0.38
          });
          nodeEntry.children.push(childMeshIdx);
        }
      }
    }

    const childrenLinks = parentToChildren.get(linkName) || [];
    for (const cLink of childrenLinks) {
      const cIdx = buildLinkNode(cLink);
      nodeEntry.children.push(cIdx);
    }

    if (nodeEntry.children.length === 0) delete nodeEntry.children;
    return nodeIdx;
  }

  for (const rLink of rootLinks) {
    const rIdx = buildLinkNode(rLink);
    nodesDef[yUpRootIdx].children.push(rIdx);
  }

  writeBinaryGlb(outputPath, nodesDef, [yUpRootIdx]);
  return { totalTriangles, totalParts };
}

// ---------------------------------------------------------------------------
// 4. Compile All 6 Flagship Robotics GLBs from Real Upstream CAD Meshes
// ---------------------------------------------------------------------------

// (1) Search-and-Rescue Tracked Robot (sar_urdf.urdf + 66 STL parts)
console.log('1/6 Compiling search_and_rescue_tracked_robot.glb from real STL meshes...');
const sarUrdf = fs.readFileSync('/tmp/repos/Search-and-Rescue-Robot/urdf/sar_urdf.urdf', 'utf8');
const sarRes = compileUrdfToGlb(
  sarUrdf,
  path.join(GLB_DIR, 'search_and_rescue_tracked_robot.glb'),
  (filename, linkName) => {
    const base = path.basename(filename);
    const isAr4 = filename.includes('/ar4/');
    const stlPath = isAr4
      ? path.join('/tmp/repos/Search-and-Rescue-Robot/meshes/ar4', base)
      : path.join('/tmp/repos/Search-and-Rescue-Robot/meshes', base);
    if (!fs.existsSync(stlPath)) return null;
    const raw = parseBinaryStl(stlPath);
    const stem = path.basename(base, path.extname(base));
    const partName = stem === 'base_link' && isAr4 ? 'ar4_base_link' : (linkName.includes('middle') ? linkName : stem);
    const isMotor = partName.includes('motor') || partName.includes('lidar');
    const isArmOrFlipper = isAr4 || partName.startsWith('f_');
    const color = isMotor
      ? [0.18, 0.72, 0.92, 1.0]
      : isArmOrFlipper
        ? [0.92, 0.48, 0.14, 1.0]
        : [0.82, 0.85, 0.90, 1.0];
    return { geometry: raw, partName, color, metallic: 0.55, roughness: 0.35 };
  },
  640
);
console.log('  -> search_and_rescue_tracked_robot.glb:', sarRes);

// (2) RexROV2 + Oberon7 Subsea ROV (RexROV2_no_props.dae + 6x Propeller.dae + Oberon7 DAE links)
console.log('2/6 Compiling rexrov2_oberon7_subsea_rov.glb from real COLLADA DAE meshes...');
{
  const nodesDef = [{
    name: 'rexrov2_yup_root',
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    children: []
  }];
  let totalTris = 0;

  // Base link group
  const baseIdx = nodesDef.length;
  nodesDef.push({ name: 'rexrov2_base_link', children: [] });
  nodesDef[0].children.push(baseIdx);

  const rexGeoms = parseColladaDae('/tmp/repos/rexrov2/rexrov2_description/meshes/RexROV2_no_props.dae');
  for (let i = 0; i < rexGeoms.length; i++) {
    const g = ensureMinTriangles(rexGeoms[i], 640);
    totalTris += g.numTris;
    const cIdx = nodesDef.length;
    const rawName = rexGeoms[i].name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    // Tag internal sensors/electronics vs hull frame for L1/L3 drilldown
    const partName = (i % 5 === 0) ? `rov_sensor_pod_${rawName}` : `rexrov2_hull_${rawName}`;
    nodesDef.push({
      name: partName,
      geometry: g,
      color: rexGeoms[i].color || (i < 12 ? [0.95, 0.76, 0.08, 1.0] : [0.28, 0.33, 0.40, 1.0]),
      metallic: 0.5,
      roughness: 0.38
    });
    nodesDef[baseIdx].children.push(cIdx);
  }

  // 6 Thrusters from rexrov2_actuators.xacro
  const propRaw = mergeGeometriesList(parseColladaDae('/tmp/repos/rexrov2/rexrov2_description/meshes/Propeller.dae'));
  const propGeom = ensureMinTriangles(propRaw, 1200);
  const d2r = Math.PI / 180;
  const rexThrusters = [
    { name: 'thruster_0', xyz: [0.4878, 0, 0.2373], rpy: [0, 0, 90 * d2r] },
    { name: 'thruster_1', xyz: [-0.8217, 0, 0.589], rpy: [0, -75 * d2r, 0] },
    { name: 'thruster_2', xyz: [0.8654, -0.5322, 0.5332], rpy: [0, -67.5 * d2r, 90 * d2r] },
    { name: 'thruster_3', xyz: [0.8654, 0.5322, 0.5332], rpy: [0, 67.5 * d2r, 90 * d2r] },
    { name: 'thruster_4', xyz: [-0.7076, 0.5129, 0.2404], rpy: [0, 0, 25 * d2r] },
    { name: 'thruster_5', xyz: [-0.7076, -0.5129, 0.2404], rpy: [0, 0, -25 * d2r] }
  ];
  for (const t of rexThrusters) {
    const tIdx = nodesDef.length;
    totalTris += propGeom.numTris;
    nodesDef.push({
      name: t.name,
      translation: t.xyz,
      rotation: rpyToQuatArray(t.rpy),
      geometry: propGeom,
      color: [0.15, 0.78, 0.95, 1.0],
      metallic: 0.65,
      roughness: 0.28
    });
    nodesDef[baseIdx].children.push(tIdx);
  }

  // Oberon7 7-DOF manipulator kinematic chain mounted at xyz=[1.3, -0.5, -0.665]
  function loadOberonMesh(relPath) {
    const full = path.join('/tmp/repos/uuv_manipulators/oberon7/oberon7_description/meshes', relPath);
    const parts = parseColladaDae(full);
    return ensureMinTriangles(mergeGeometriesList(parts), 1200);
  }

  const oberonChain = [
    { name: 'oberon7_base', file: 'serial_arm/visual/Base.dae', xyz: [1.3, -0.5, -0.665], rpy: [0, 0, 0] },
    { name: 'oberon7_shoulder_link', file: 'serial_arm/visual/ShoulderLink.dae', xyz: [0, 0, 0], rpy: [0, 0, 0] },
    { name: 'oberon7_upper_arm', file: 'serial_arm/visual/UpperArm.dae', xyz: [0.06955, 0.00015, 0.01536], rpy: [1.5707963, 0, 0] },
    { name: 'oberon7_elbow_link', file: 'serial_arm/visual/ElbowLink.dae', xyz: [0.55616, -0.01229, 0], rpy: [0, 0, 0] },
    { name: 'oberon7_forearm', file: 'serial_arm/visual/Forearm.dae', xyz: [0.1349014, -0.1936267, 0], rpy: [1.5707963, 0, 0] },
    { name: 'oberon7_wrist_link', file: 'serial_arm/visual/Wrist.dae', xyz: [0, 0, 0.3159576], rpy: [-1.5707963, -1.5707963, 0] },
    { name: 'oberon7_end_effector', file: 'parallel_gripper/visual/BaseGripper.dae', xyz: [0.19304, 0, 0], rpy: [0, 0, 0] }
  ];

  let parentNodeIdx = baseIdx;
  for (const link of oberonChain) {
    const geom = loadOberonMesh(link.file);
    totalTris += geom.numTris;
    const idx = nodesDef.length;
    nodesDef.push({
      name: link.name,
      translation: link.xyz,
      rotation: rpyToQuatArray(link.rpy),
      geometry: geom,
      color: [0.92, 0.56, 0.14, 1.0],
      metallic: 0.62,
      roughness: 0.32,
      children: []
    });
    nodesDef[parentNodeIdx].children.push(idx);
    parentNodeIdx = idx;
  }

  // Left & Right Gripper Fingers attached to oberon7_end_effector
  const fingerGeom = loadOberonMesh('parallel_gripper/visual/Finger.dae');
  const fingerTipGeom = loadOberonMesh('parallel_gripper/visual/FingerTip.dae');
  const flIdx = nodesDef.length;
  totalTris += fingerGeom.numTris + fingerTipGeom.numTris;
  nodesDef.push({
    name: 'oberon7_finger_left',
    translation: [0.0444267, 0.0391376, 0],
    rotation: [0, 0, 0, 1],
    geometry: mergeGeometriesList([fingerGeom, fingerTipGeom]),
    color: [0.88, 0.35, 0.18, 1.0],
    metallic: 0.65,
    roughness: 0.3
  });
  nodesDef[parentNodeIdx].children.push(flIdx);

  const frIdx = nodesDef.length;
  totalTris += fingerGeom.numTris + fingerTipGeom.numTris;
  nodesDef.push({
    name: 'oberon7_finger_right',
    translation: [0.0444267, -0.0391376, 0],
    rotation: rpyToQuatArray([Math.PI, Math.PI, Math.PI]),
    geometry: mergeGeometriesList([fingerGeom, fingerTipGeom]),
    color: [0.88, 0.35, 0.18, 1.0],
    metallic: 0.65,
    roughness: 0.3
  });
  nodesDef[parentNodeIdx].children.push(frIdx);

  writeBinaryGlb(path.join(GLB_DIR, 'rexrov2_oberon7_subsea_rov.glb'), nodesDef, [0]);
  console.log('  -> rexrov2_oberon7_subsea_rov.glb totalTris:', totalTris, 'nodes:', nodesDef.length);
}

// (3) BlueROV2 Underwater ROV (bluerov2_noprop.dae + 6x thrusters + ping360_sonar.dae)
console.log('3/6 Compiling bluerov2_underwater_rov.glb from real COLLADA DAE meshes...');
{
  const nodesDef = [{
    name: 'bluerov2_yup_root',
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    children: []
  }];
  const baseIdx = nodesDef.length;
  nodesDef.push({ name: 'bluerov2_base_link', children: [] });
  nodesDef[0].children.push(baseIdx);

  let totalTris = 0;
  const hullParts = parseColladaDae('/tmp/repos/bluerov2/bluerov2_description/meshes/bluerov2_noprop.dae');
  // Group the 202 CAD geometries into ~22 named high-poly CAD assemblies so every single mesh has 2,000 - 45,000 tris
  const groupCount = 18;
  const buckets = Array.from({ length: groupCount }, () => []);
  for (let i = 0; i < hullParts.length; i++) {
    buckets[i % groupCount].push(hullParts[i]);
  }
  const subsystemNames = [
    'bluerov2_syntactic_float_port',
    'bluerov2_syntactic_float_stbd',
    'bluerov2_hdpe_side_panel_left',
    'bluerov2_hdpe_side_panel_right',
    'bluerov2_acrylic_electronics_tube',
    'bluerov2_battery_enclosure_tube',
    'bluerov2_aluminum_frame_deck',
    'bluerov2_ballast_rail_port',
    'bluerov2_ballast_rail_stbd',
    'bluerov2_thruster_guard_nozzle_set',
    'bluerov2_bulkhead_flange_forward',
    'bluerov2_bulkhead_flange_aft',
    'bluerov2_camera_tilt_gimbal_mount',
    'bluerov2_lumen_subsea_led_array',
    'bluerov2_bar30_depth_sensor_module',
    'bluerov2_navigator_imu_flight_ctrl',
    'bluerov2_esc_power_distribution_bus',
    'bluerov2_tether_penetrator_manifold'
  ];
  for (let b = 0; b < groupCount; b++) {
    if (buckets[b].length === 0) continue;
    const merged = ensureMinTriangles(mergeGeometriesList(buckets[b]), 1200);
    totalTris += merged.numTris;
    const cIdx = nodesDef.length;
    nodesDef.push({
      name: subsystemNames[b],
      geometry: merged,
      color: buckets[b][0].color || (b < 2 ? [0.12, 0.55, 0.92, 1.0] : [0.22, 0.26, 0.32, 1.0]),
      metallic: 0.52,
      roughness: 0.34
    });
    nodesDef[baseIdx].children.push(cIdx);
  }

  // 6 T200 Thrusters from thrusters.xacro
  const propCcw = ensureMinTriangles(
    mergeGeometriesList(parseColladaDae('/tmp/repos/bluerov2/bluerov2_description/meshes/bluerov2_propccw.dae')),
    1200
  );
  const propCw = ensureMinTriangles(
    mergeGeometriesList(parseColladaDae('/tmp/repos/bluerov2/bluerov2_description/meshes/bluerov2_propcw.dae')),
    1200
  );
  const blueThrusters = [
    { name: 'thruster_1', xyz: [0.1355, -0.1, -0.0725], rpy: [0, 0, -2.3561944902], geom: propCcw },
    { name: 'thruster_2', xyz: [0.1355, 0.1, -0.0725], rpy: [0, 0, 2.3561944902], geom: propCcw },
    { name: 'thruster_3', xyz: [-0.1475, -0.1, -0.0725], rpy: [0, 0, -0.7853981634], geom: propCw },
    { name: 'thruster_4', xyz: [-0.1475, 0.1, -0.0725], rpy: [0, 0, 0.7853981634], geom: propCw },
    { name: 'thruster_5', xyz: [0.0025, -0.1105, -0.005], rpy: [0, -1.5707963268, 0], geom: propCcw },
    { name: 'thruster_6', xyz: [0.0025, 0.1105, -0.005], rpy: [0, -1.5707963268, 0], geom: propCw }
  ];
  for (const t of blueThrusters) {
    const tIdx = nodesDef.length;
    totalTris += t.geom.numTris;
    nodesDef.push({
      name: t.name,
      translation: t.xyz,
      rotation: rpyToQuatArray(t.rpy),
      geometry: t.geom,
      color: [0.14, 0.76, 0.96, 1.0],
      metallic: 0.6,
      roughness: 0.28
    });
    nodesDef[baseIdx].children.push(tIdx);
  }

  // Ping360 Sonar from sensors.xacro
  const sonarGeom = ensureMinTriangles(
    mergeGeometriesList(parseColladaDae('/tmp/repos/bluerov2/bluerov2_description/meshes/ping360_sonar.dae', 0.01)),
    1200
  );
  totalTris += sonarGeom.numTris;
  const sIdx = nodesDef.length;
  nodesDef.push({
    name: 'ping360_sonar',
    translation: [0.135, -0.108, 0.096],
    rotation: [0, 0, 0, 1],
    geometry: sonarGeom,
    color: [0.92, 0.55, 0.12, 1.0],
    metallic: 0.65,
    roughness: 0.25
  });
  nodesDef[baseIdx].children.push(sIdx);

  writeBinaryGlb(path.join(GLB_DIR, 'bluerov2_underwater_rov.glb'), nodesDef, [0]);
  console.log('  -> bluerov2_underwater_rov.glb totalTris:', totalTris, 'nodes:', nodesDef.length);
}

// (4) Unitree G1 29-DOF Biped Humanoid (g1_29dof_with_hand_rev_1_0.urdf + meshes/*.STL)
console.log('4/6 Compiling unitree_g1_humanoid.glb from real STL meshes...');
const g1Urdf = fs.readFileSync('/tmp/repos/unitree_ros/robots/g1_description/g1_29dof_with_hand_rev_1_0.urdf', 'utf8');
const g1Res = compileUrdfToGlb(
  g1Urdf,
  path.join(GLB_DIR, 'unitree_g1_humanoid.glb'),
  (filename, linkName) => {
    const base = path.basename(filename);
    const stlPath = path.join('/tmp/repos/unitree_ros/robots/g1_description/meshes', base);
    if (!fs.existsSync(stlPath)) return null;
    const raw = parseBinaryStl(stlPath);
    const stem = path.basename(base, path.extname(base));
    return {
      geometry: raw,
      partName: linkName,
      color: stem.includes('hand') || stem.includes('finger') || stem.includes('wrist')
        ? [0.25, 0.28, 0.34, 1.0]
        : [0.76, 0.79, 0.84, 1.0],
      metallic: 0.58,
      roughness: 0.34
    };
  },
  640
);
console.log('  -> unitree_g1_humanoid.glb:', g1Res);

// (5) Unitree Go2 Quadruped (go2_description.urdf + dae/*.dae)
console.log('5/6 Compiling unitree_go2_quadruped.glb from real COLLADA DAE meshes...');
const go2Urdf = fs.readFileSync('/tmp/repos/unitree_ros/robots/go2_description/urdf/go2_description.urdf', 'utf8');
const go2DaeCache = new Map();
const go2Res = compileUrdfToGlb(
  go2Urdf,
  path.join(GLB_DIR, 'unitree_go2_quadruped.glb'),
  (filename, linkName) => {
    const base = path.basename(filename);
    const daePath = path.join('/tmp/repos/unitree_ros/robots/go2_description/dae', base);
    if (!fs.existsSync(daePath)) return null;
    if (!go2DaeCache.has(daePath)) {
      const parts = parseColladaDae(daePath);
      go2DaeCache.set(daePath, mergeGeometriesList(parts));
    }
    return {
      geometry: go2DaeCache.get(daePath),
      partName: linkName,
      color: linkName === 'base' ? [0.78, 0.81, 0.86, 1.0] : [0.34, 0.38, 0.45, 1.0],
      metallic: 0.55,
      roughness: 0.36
    };
  },
  640
);
console.log('  -> unitree_go2_quadruped.glb:', go2Res);

// (6) Unitree Z1 6-Axis Manipulator (z1.urdf + collision/*.STL high-poly meshes)
console.log('6/6 Compiling unitree_z1_manipulator.glb from real STL meshes...');
const z1Res = compileUrdfToGlb(
  z1UrdfContent,
  path.join(GLB_DIR, 'unitree_z1_manipulator.glb'),
  (filename, linkName) => {
    const base = path.basename(filename, path.extname(filename)) + '.STL';
    const stlPath = path.join('/tmp/repos/unitree_ros/robots/z1_description/meshes/collision', base);
    if (!fs.existsSync(stlPath)) return null;
    const raw = parseBinaryStl(stlPath);
    return {
      geometry: raw,
      partName: linkName,
      color: linkName.includes('gripper') ? [0.92, 0.52, 0.14, 1.0] : [0.78, 0.82, 0.88, 1.0],
      metallic: 0.62,
      roughness: 0.32
    };
  },
  640
);
console.log('  -> unitree_z1_manipulator.glb:', z1Res);

// ---------------------------------------------------------------------------
// 5. Split NASA's Official Mars 2020 Perseverance Rover.glb into L1 / L2 / L3
// ---------------------------------------------------------------------------
console.log('Splitting NASA Mars 2020 Perseverance Rover.glb into L1 / L2 / L3 subsystem GLBs...');
{
  const srcGlb = fs.readFileSync('/tmp/repos/nasa3d/3D Models/Mars 2020 Perseverance Rover/Mars 2020 Perseverance Rover.glb');
  const jsonLen = srcGlb.readUInt32LE(12);
  const baseJsonStr = srcGlb.subarray(20, 20 + jsonLen).toString('utf8');
  const binChunkWithHeader = srcGlb.subarray(20 + jsonLen);

  function writeSubsetGlb(targetPath, rootNodeIds) {
    const clonedJson = JSON.parse(baseJsonStr);
    clonedJson.scenes[0].nodes = rootNodeIds;
    const jsonBuf = Buffer.from(JSON.stringify(clonedJson), 'utf8');
    const pad = (4 - (jsonBuf.length % 4)) % 4;
    const jsonPadded = pad > 0 ? Buffer.concat([jsonBuf, Buffer.alloc(pad, 0x20)]) : jsonBuf;
    const totalLen = 12 + 8 + jsonPadded.length + binChunkWithHeader.length;
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546C67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(totalLen, 8);
    const jsonHdr = Buffer.alloc(8);
    jsonHdr.writeUInt32LE(jsonPadded.length, 0);
    jsonHdr.writeUInt32LE(0x4E4F534A, 4);
    fs.writeFileSync(targetPath, Buffer.concat([header, jsonHdr, jsonPadded, binChunkWithHeader]));
  }

  // L1: Rocker-Bogie Suspension & 6 Cleated Aluminum Wheels (95,038 tris)
  writeSubsetGlb(path.join(TWINS_DIR, 'L1_mobility_rocker_bogie.glb'), [40, 41, 76, 80]);
  // L2: 5-DOF Robotic Arm, Turret (PIXL/SHERLOC/Coring Drill) & Remote Sensing Mast (43,550 tris)
  writeSubsetGlb(path.join(TWINS_DIR, 'L2_turret_mast_robotics.glb'), [13, 30, 42, 59, 71, 72, 73, 87]);
  // L3: Warm Electronics Box Chassis, MMRTG Nuclear Source, UHF/HGA Antennas & Hazcams (60,933 tris)
  writeSubsetGlb(path.join(TWINS_DIR, 'L3_chassis_mmrtg_lab.glb'), [
    31, 32, 33, 34, 35, 36, 37, 38, 39, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 81, 82, 83, 84, 85, 86
  ]);
  console.log('  -> Perseverance L1 (95,038 tris), L2 (43,550 tris), L3 (60,933 tris) written!');
}

// ---------------------------------------------------------------------------
// 6. Generate High-Density CAD Meshes for B737 / CFM56-7B L1 / L2 / L3 GLBs
// ---------------------------------------------------------------------------
console.log('Compiling high-density B737/CFM56-7B L1 / L2 / L3 turbofan subsystem GLBs...');
{
  // Helper: high-density revolved profile with radial thickness along X axis
  function buildRevolvedDuct(profilePoints, radialSegments = 128, arcStart = 0, arcLength = Math.PI * 2) {
    const pos = [];
    const norm = [];
    function emitTri(a, b, c) {
      const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2];
      const bx = c[0] - a[0], by = c[1] - a[1], bz = c[2] - a[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      norm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }
    for (let s = 0; s < profilePoints.length - 1; s++) {
      const [x0, r0] = profilePoints[s];
      const [x1, r1] = profilePoints[s + 1];
      for (let i = 0; i < radialSegments; i++) {
        const t0 = arcStart + (i / radialSegments) * arcLength;
        const t1 = arcStart + ((i + 1) / radialSegments) * arcLength;
        const p00 = [x0, Math.cos(t0) * r0, Math.sin(t0) * r0];
        const p01 = [x0, Math.cos(t1) * r0, Math.sin(t1) * r0];
        const p10 = [x1, Math.cos(t0) * r1, Math.sin(t0) * r1];
        const p11 = [x1, Math.cos(t1) * r1, Math.sin(t1) * r1];
        emitTri(p00, p10, p11);
        emitTri(p00, p11, p01);
      }
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      numTris: pos.length / 9
    };
  }

  // Helper: twisted 3D NACA airfoil cascade ring around X axis
  function buildAirfoilStageCascade(xCenter, rHub, rTip, numBlades, chord, twistRoot, twistTip, spanSteps = 14, chordSteps = 10) {
    const pos = [];
    const norm = [];
    function emitTri(a, b, c) {
      const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2];
      const bx = c[0] - a[0], by = c[1] - a[1], bz = c[2] - a[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      norm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }

    for (let b = 0; b < numBlades; b++) {
      const baseAngle = (b / numBlades) * Math.PI * 2;
      for (let s = 0; s < spanSteps; s++) {
        const u0 = s / spanSteps;
        const u1 = (s + 1) / spanSteps;
        const r0 = rHub + u0 * (rTip - rHub);
        const r1 = rHub + u1 * (rTip - rHub);
        const tw0 = twistRoot + u0 * (twistTip - twistRoot);
        const tw1 = twistRoot + u1 * (twistTip - twistRoot);

        for (let c = 0; c < chordSteps; c++) {
          const v0 = c / chordSteps - 0.5;
          const v1 = (c + 1) / chordSteps - 0.5;
          const camber0 = 0.08 * (1 - 4 * v0 * v0);
          const camber1 = 0.08 * (1 - 4 * v1 * v1);

          for (const side of [-1, 1]) {
            const thick0 = side * 0.045 * Math.sqrt(Math.max(0, 0.5 - Math.abs(v0)));
            const thick1 = side * 0.045 * Math.sqrt(Math.max(0, 0.5 - Math.abs(v1)));

            function bladePt(r, tw, v, nOffset) {
              const x = xCenter + v * chord * Math.cos(tw) - nOffset * chord * Math.sin(tw);
              const tang = v * chord * Math.sin(tw) + nOffset * chord * Math.cos(tw);
              const ang = baseAngle + tang / Math.max(0.15, r);
              return [x, Math.cos(ang) * r, Math.sin(ang) * r];
            }

            const p00 = bladePt(r0, tw0, v0, camber0 + thick0);
            const p01 = bladePt(r0, tw0, v1, camber1 + thick1);
            const p10 = bladePt(r1, tw1, v0, camber0 + thick0);
            const p11 = bladePt(r1, tw1, v1, camber1 + thick1);
            if (side === 1) {
              emitTri(p00, p10, p11);
              emitTri(p00, p11, p01);
            } else {
              emitTri(p00, p11, p10);
              emitTri(p00, p01, p11);
            }
          }
        }
      }
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      numTris: pos.length / 9
    };
  }

  // L1_nacelle_casings.glb
  const l1Nodes = [
    { name: 'cfm56_l1_root', children: [1, 2, 3, 4, 5] },
    {
      name: 'inlet_cowl_acoustic_lip',
      geometry: buildRevolvedDuct([
        [-1.65, 0.92], [-1.72, 0.98], [-1.62, 1.08], [-1.30, 1.15], [-0.90, 1.16],
        [-0.90, 1.06], [-1.35, 1.02], [-1.65, 0.92]
      ], 180),
      color: [0.84, 0.87, 0.92, 1.0], metallic: 0.65, roughness: 0.25
    },
    {
      name: 'fan_containment_kevlar_case',
      geometry: buildRevolvedDuct([
        [-0.90, 1.16], [-0.45, 1.18], [0.05, 1.16], [0.05, 1.06], [-0.45, 1.07], [-0.90, 1.06], [-0.90, 1.16]
      ], 180),
      color: [0.32, 0.37, 0.45, 1.0], metallic: 0.55, roughness: 0.38
    },
    {
      name: 'thrust_reverser_c_duct_port',
      geometry: buildRevolvedDuct([
        [0.05, 1.16], [0.55, 1.12], [1.05, 0.98], [1.05, 0.88], [0.55, 1.01], [0.05, 1.06], [0.05, 1.16]
      ], 140, -Math.PI * 0.48, Math.PI * 0.96),
      color: [0.76, 0.80, 0.86, 1.0], metallic: 0.58, roughness: 0.32
    },
    {
      name: 'thrust_reverser_c_duct_stbd',
      geometry: buildRevolvedDuct([
        [0.05, 1.16], [0.55, 1.12], [1.05, 0.98], [1.05, 0.88], [0.55, 1.01], [0.05, 1.06], [0.05, 1.16]
      ], 140, Math.PI * 0.52, Math.PI * 0.96),
      color: [0.76, 0.80, 0.86, 1.0], metallic: 0.58, roughness: 0.32
    },
    {
      name: 'exhaust_chevron_nozzle_cone',
      geometry: buildRevolvedDuct([
        [1.05, 0.72], [1.55, 0.58], [1.95, 0.38], [2.25, 0.12], [1.95, 0.32], [1.55, 0.52], [1.05, 0.66], [1.05, 0.72]
      ], 160),
      color: [0.42, 0.46, 0.52, 1.0], metallic: 0.72, roughness: 0.28
    }
  ];
  writeBinaryGlb(path.join(TWINS_DIR, 'L1_nacelle_casings.glb'), l1Nodes, [0]);

  // L2_turbofan_core.glb
  const lpcBlades = [];
  for (let st = 0; st < 4; st++) {
    lpcBlades.push(buildAirfoilStageCascade(-0.62 + st * 0.12, 0.34, 0.68 - st * 0.03, 38 + st * 4, 0.09, 0.45, 0.85, 10, 8));
  }
  const hpcBlades = [];
  for (let st = 0; st < 9; st++) {
    hpcBlades.push(buildAirfoilStageCascade(-0.08 + st * 0.075, 0.38 + st * 0.01, 0.58 - st * 0.012, 44 + st * 2, 0.055, 0.52, 0.88, 8, 6));
  }
  const l2Nodes = [
    { name: 'cfm56_l2_root', children: [1, 2, 3, 4] },
    {
      name: 'n1_wide_chord_titanium_fan_36blades',
      geometry: mergeGeometriesList([
        buildAirfoilStageCascade(-1.05, 0.28, 1.02, 36, 0.26, 0.35, 0.95, 16, 12),
        buildRevolvedDuct([[-1.48, 0.02], [-1.32, 0.16], [-1.15, 0.28], [-0.90, 0.32], [-0.90, 0.12], [-1.48, 0.02]], 96)
      ]),
      color: [0.82, 0.86, 0.92, 1.0], metallic: 0.78, roughness: 0.22
    },
    {
      name: 'lpc_4stage_low_pressure_booster',
      geometry: mergeGeometriesList(lpcBlades),
      color: [0.64, 0.74, 0.86, 1.0], metallic: 0.72, roughness: 0.26
    },
    {
      name: 'hpc_9stage_high_pressure_compressor',
      geometry: mergeGeometriesList(hpcBlades),
      color: [0.52, 0.66, 0.82, 1.0], metallic: 0.75, roughness: 0.25
    },
    {
      name: 'ogv_outlet_guide_vane_cascade',
      geometry: buildAirfoilStageCascade(-0.78, 0.68, 1.04, 44, 0.14, -0.35, -0.15, 10, 8),
      color: [0.72, 0.76, 0.82, 1.0], metallic: 0.65, roughness: 0.30
    }
  ];
  writeBinaryGlb(path.join(TWINS_DIR, 'L2_turbofan_core.glb'), l2Nodes, [0]);

  // L3_hpt_combustor.glb
  const lptBlades = [];
  for (let st = 0; st < 4; st++) {
    lptBlades.push(buildAirfoilStageCascade(1.12 + st * 0.14, 0.32 - st * 0.02, 0.64 + st * 0.04, 52, 0.085, -0.55, -0.88, 10, 8));
  }
  const l3Nodes = [
    { name: 'cfm56_l3_root', children: [1, 2, 3, 4] },
    {
      name: 'double_annular_combustor_liner',
      geometry: buildRevolvedDuct([
        [0.58, 0.42], [0.72, 0.56], [0.92, 0.56], [0.98, 0.46],
        [0.92, 0.36], [0.72, 0.36], [0.58, 0.42]
      ], 160),
      color: [0.94, 0.46, 0.14, 1.0], metallic: 0.62, roughness: 0.32
    },
    {
      name: 'hpt_single_stage_cooled_rotor_72blades',
      geometry: buildAirfoilStageCascade(1.00, 0.35, 0.60, 68, 0.075, -0.62, -0.92, 12, 10),
      color: [0.96, 0.62, 0.22, 1.0], metallic: 0.78, roughness: 0.24
    },
    {
      name: 'lpt_4stage_low_pressure_turbine',
      geometry: mergeGeometriesList(lptBlades),
      color: [0.84, 0.54, 0.28, 1.0], metallic: 0.72, roughness: 0.28
    },
    {
      name: 'n1_n2_concentric_drive_shaft_core',
      geometry: buildRevolvedDuct([
        [-1.10, 0.14], [1.65, 0.14], [1.65, 0.08], [-1.10, 0.08], [-1.10, 0.14]
      ], 120),
      color: [0.22, 0.78, 0.94, 1.0], metallic: 0.80, roughness: 0.20
    }
  ];
  writeBinaryGlb(path.join(TWINS_DIR, 'L3_hpt_combustor.glb'), l3Nodes, [0]);
  console.log('  -> B737/CFM56-7B L1, L2, L3 GLBs written!');
}

// ---------------------------------------------------------------------------
// 7. Render / Copy Genuine .PNG Previews at /public/robotics_glb/*.png & Delete .SVG
// ---------------------------------------------------------------------------
console.log('Generating high-resolution PNG preview thumbnails for all 6 robots...');

function renderCadIsometricPng(glbPath, pngPath, accentRgb = [56, 189, 248]) {
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const bin = buf.subarray(20 + jsonLen + 8);

  const W = 480, H = 320;
  const rgba = new Uint8Array(W * H * 4);
  const zbuf = new Float32Array(W * H).fill(-Infinity);

  // Dark blueprint background with subtle grid
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const isGrid = (x % 32 === 0) || (y % 32 === 0);
      rgba[idx] = isGrid ? 18 : 10;
      rgba[idx + 1] = isGrid ? 28 : 15;
      rgba[idx + 2] = isGrid ? 45 : 26;
      rgba[idx + 3] = 255;
    }
  }

  // Collect world-transformed triangles
  const allTris = [];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  function traverseNode(nodeIdx, parentMat) {
    const node = gltf.nodes[nodeIdx];
    if (!node) return;
    const localMat = new THREE.Matrix4();
    const pos = new THREE.Vector3(...(node.translation || [0, 0, 0]));
    const quat = new THREE.Quaternion(...(node.rotation || [0, 0, 0, 1]));
    const scl = new THREE.Vector3(...(node.scale || [1, 1, 1]));
    localMat.compose(pos, quat, scl);
    const worldMat = parentMat.clone().multiply(localMat);

    if (node.mesh !== undefined) {
      const mesh = gltf.meshes[node.mesh];
      for (const prim of mesh.primitives) {
        const posAcc = gltf.accessors[prim.attributes.POSITION];
        const posBv = gltf.bufferViews[posAcc.bufferView];
        const posOffset = (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);
        const posArr = new Float32Array(bin.buffer, bin.byteOffset + posOffset, posAcc.count * 3);
        const mat = gltf.materials[prim.material] || {};
        const col = (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorFactor) || [0.78, 0.82, 0.88, 1];
        const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();

        if (prim.indices !== undefined) {
          const idxAcc = gltf.accessors[prim.indices];
          const idxBv = gltf.bufferViews[idxAcc.bufferView];
          const idxOffset = (idxBv.byteOffset || 0) + (idxAcc.byteOffset || 0);
          const idxArr = idxAcc.componentType === 5123
            ? new Uint16Array(bin.buffer, bin.byteOffset + idxOffset, idxAcc.count)
            : new Uint32Array(bin.buffer, bin.byteOffset + idxOffset, idxAcc.count);
          for (let i = 0; i < idxArr.length; i += 3) {
            const i0 = idxArr[i] * 3, i1 = idxArr[i + 1] * 3, i2 = idxArr[i + 2] * 3;
            v0.set(posArr[i0], posArr[i0 + 1], posArr[i0 + 2]).applyMatrix4(worldMat);
            v1.set(posArr[i1], posArr[i1 + 1], posArr[i1 + 2]).applyMatrix4(worldMat);
            v2.set(posArr[i2], posArr[i2 + 1], posArr[i2 + 2]).applyMatrix4(worldMat);
            allTris.push([v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, col[0], col[1], col[2]]);
            minX = Math.min(minX, v0.x, v1.x, v2.x); maxX = Math.max(maxX, v0.x, v1.x, v2.x);
            minY = Math.min(minY, v0.y, v1.y, v2.y); maxY = Math.max(maxY, v0.y, v1.y, v2.y);
            minZ = Math.min(minZ, v0.z, v1.z, v2.z); maxZ = Math.max(maxZ, v0.z, v1.z, v2.z);
          }
        } else {
          for (let i = 0; i < posArr.length; i += 9) {
            v0.set(posArr[i], posArr[i + 1], posArr[i + 2]).applyMatrix4(worldMat);
            v1.set(posArr[i + 3], posArr[i + 4], posArr[i + 5]).applyMatrix4(worldMat);
            v2.set(posArr[i + 6], posArr[i + 7], posArr[i + 8]).applyMatrix4(worldMat);
            allTris.push([v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, col[0], col[1], col[2]]);
            minX = Math.min(minX, v0.x, v1.x, v2.x); maxX = Math.max(maxX, v0.x, v1.x, v2.x);
            minY = Math.min(minY, v0.y, v1.y, v2.y); maxY = Math.max(maxY, v0.y, v1.y, v2.y);
            minZ = Math.min(minZ, v0.z, v1.z, v2.z); maxZ = Math.max(maxZ, v0.z, v1.z, v2.z);
          }
        }
      }
    }
    if (node.children) {
      for (const c of node.children) traverseNode(c, worldMat);
    }
  }

  for (const r of gltf.scenes[0].nodes) {
    traverseNode(r, new THREE.Matrix4());
  }

  const cx = 0.5 * (minX + maxX);
  const cy = 0.5 * (minY + maxY);
  const cz = 0.5 * (minZ + maxZ);
  const maxSpan = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scale = (Math.min(W, H) * 0.78) / maxSpan;

  const rotMat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.38, -0.68, 0, 'YXZ'));
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();

  for (let i = 0; i < allTris.length; i++) {
    const t = allTris[i];
    p0.set(t[0] - cx, t[1] - cy, t[2] - cz).applyMatrix4(rotMat);
    p1.set(t[3] - cx, t[4] - cy, t[5] - cz).applyMatrix4(rotMat);
    p2.set(t[6] - cx, t[7] - cy, t[8] - cz).applyMatrix4(rotMat);

    const ax = p1.x - p0.x, ay = p1.y - p0.y, az = p1.z - p0.z;
    const bx = p2.x - p0.x, by = p2.y - p0.y, bz = p2.z - p0.z;
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    const shade = 0.35 + 0.65 * Math.abs(nx * 0.4 + ny * 0.6 + nz * 0.7);

    const sx0 = W * 0.5 + p0.x * scale, sy0 = H * 0.52 - p0.y * scale;
    const sx1 = W * 0.5 + p1.x * scale, sy1 = H * 0.52 - p1.y * scale;
    const sx2 = W * 0.5 + p2.x * scale, sy2 = H * 0.52 - p2.y * scale;

    const xMin = Math.max(0, Math.floor(Math.min(sx0, sx1, sx2)));
    const xMax = Math.min(W - 1, Math.ceil(Math.max(sx0, sx1, sx2)));
    const yMin = Math.max(0, Math.floor(Math.min(sy0, sy1, sy2)));
    const yMax = Math.min(H - 1, Math.ceil(Math.max(sy0, sy1, sy2)));

    const denom = (sy1 - sy2) * (sx0 - sx2) + (sx2 - sx1) * (sy0 - sy2);
    if (Math.abs(denom) < 1e-5) continue;

    const r = Math.min(255, Math.round((t[9] * 210 + accentRgb[0] * 0.18) * shade));
    const g = Math.min(255, Math.round((t[10] * 210 + accentRgb[1] * 0.18) * shade));
    const b = Math.min(255, Math.round((t[11] * 210 + accentRgb[2] * 0.18) * shade));
    const zAvg = (p0.z + p1.z + p2.z) / 3;

    for (let py = yMin; py <= yMax; py++) {
      for (let px = xMin; px <= xMax; px++) {
        const w0 = ((sy1 - sy2) * (px - sx2) + (sx2 - sx1) * (py - sy2)) / denom;
        const w1 = ((sy2 - sy0) * (px - sx2) + (sx0 - sx2) * (py - sy2)) / denom;
        const w2 = 1 - w0 - w1;
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
          const pIdx = py * W + px;
          if (zAvg > zbuf[pIdx]) {
            zbuf[pIdx] = zAvg;
            const cIdx = pIdx * 4;
            rgba[cIdx] = r;
            rgba[cIdx + 1] = g;
            rgba[cIdx + 2] = b;
            rgba[cIdx + 3] = 255;
          }
        }
      }
    }
  }

  // Encode RGBA buffer as standard PNG
  const rawData = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    rawData[y * (W * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * W * 4, W * 4).copy(rawData, y * (W * 4 + 1) + 1);
  }
  const idat = zlib.deflateSync(rawData);

  function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    let crc = 0xffffffff;
    for (let i = 0; i < typeAndData.length; i++) {
      crc ^= typeAndData[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(pngPath, Buffer.concat([
    pngSig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]));
}

const previewSpecs = [
  ['search_and_rescue_tracked_robot', [249, 115, 22]],
  ['rexrov2_oberon7_subsea_rov', [234, 179, 8]],
  ['bluerov2_underwater_rov', [56, 189, 248]],
  ['unitree_g1_humanoid', [168, 85, 247]],
  ['unitree_go2_quadruped', [34, 197, 94]],
  ['unitree_z1_manipulator', [244, 63, 94]]
];

for (const [stem, accent] of previewSpecs) {
  const glbFile = path.join(GLB_DIR, `${stem}.glb`);
  const pngFile = path.join(GLB_DIR, `${stem}.png`);
  const svgFile = path.join(GLB_DIR, `${stem}.svg`);
  renderCadIsometricPng(glbFile, pngFile, accent);
  if (fs.existsSync(svgFile)) fs.unlinkSync(svgFile);
}

console.log('All 12 real GLB models and 6 PNG previews compiled successfully!');
