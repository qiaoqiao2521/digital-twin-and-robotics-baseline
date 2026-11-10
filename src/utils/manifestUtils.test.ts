import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROBOT_PACKS,
  TWIN_WORKSTATIONS,
  filterRepositories,
  parseKinematicStats,
  parseUrdfJoints,
  classifyMeshLayer,
  computeGhostMaterialState,
  computeClipPlaneConstant,
  ManifestRepo
} from './manifestUtils';

describe('manifestUtils pure logic suite', () => {
  it('exposes all 6 flagship robot packs with valid .glb and .png asset paths on disk', () => {
    assert.equal(ROBOT_PACKS.length, 6);
    for (const pack of ROBOT_PACKS) {
      assert.ok(pack.glbUrl.startsWith('/robotics_glb/'));
      assert.ok(pack.glbUrl.endsWith('.glb'));
      assert.ok(pack.previewUrl.startsWith('/robotics_glb/'));
      assert.ok(pack.previewUrl.endsWith('.png'), `Expected .png preview for ${pack.id}`);

      const glbDiskPath = path.resolve('public', pack.glbUrl.slice(1));
      const pngDiskPath = path.resolve('public', pack.previewUrl.slice(1));
      assert.ok(fs.existsSync(glbDiskPath), `Missing GLB on disk: ${glbDiskPath}`);
      assert.ok(fs.existsSync(pngDiskPath), `Missing PNG on disk: ${pngDiskPath}`);

      const stat = fs.statSync(glbDiskPath);
      assert.ok(stat.size > 100_000 && stat.size < 25 * 1024 * 1024, `Unexpected GLB size for ${pack.id}: ${stat.size}`);
      const fd = fs.openSync(glbDiskPath, 'r');
      const hdr = Buffer.alloc(4);
      fs.readSync(fd, hdr, 0, 4, 0);
      fs.closeSync(fd);
      assert.equal(hdr.toString('ascii'), 'glTF', `Invalid GLB magic header for ${pack.id}`);
    }
  });

  it('defines L0..L3 4-stage drill-down levels and /twins/models/*.glb paths on disk for workstations', () => {
    const keys = ['mars2020', 'b737_cfm56', 'b737_bridge'] as const;
    for (const k of keys) {
      const ws = TWIN_WORKSTATIONS[k];
      assert.equal(ws.levels.length, 4);
      assert.deepEqual(
        ws.levels.map((l) => l.level),
        ['L0', 'L1', 'L2', 'L3']
      );
      for (const layerUrl of [ws.glbLayers.L1, ws.glbLayers.L2, ws.glbLayers.L3]) {
        assert.ok(layerUrl.startsWith('/twins/models/'));
        const diskPath = path.resolve('public', layerUrl.slice(1));
        assert.ok(fs.existsSync(diskPath), `Missing Twin GLB on disk: ${diskPath}`);
      }
    }
  });

  it('parses URDF joints with origin xyz/rpy, axis xyz, and limits accurately', () => {
    const sampleUrdf = `<?xml version="1.0"?>
      <robot name="sar_final_v4">
        <link name="base_link"/>
        <link name="f_front_left"/>
        <joint name="joint_f_front_left" type="continuous">
          <origin xyz="0.163 -0.442 0.04" rpy="1.598 0 0"/>
          <parent link="base_link"/>
          <child link="f_front_left"/>
          <axis xyz="-1 0 0"/>
        </joint>
        <link name="link_1"/>
        <joint name="joint_1" type="revolute">
          <origin xyz="0 0 0.05" rpy="0 0 0"/>
          <parent link="base_link"/>
          <child link="link_1"/>
          <axis xyz="0 0 1"/>
          <limit lower="-2.96" upper="2.96" effort="100" velocity="2"/>
        </joint>
      </robot>
    `;
    const joints = parseUrdfJoints(sampleUrdf);
    assert.equal(joints.length, 2);
    assert.equal(joints[0].name, 'joint_f_front_left');
    assert.equal(joints[0].type, 'continuous');
    assert.equal(joints[0].parent, 'base_link');
    assert.equal(joints[0].child, 'f_front_left');
    assert.deepEqual(joints[0].axis, [-1, 0, 0]);
    assert.equal(joints[1].name, 'joint_1');
    assert.equal(joints[1].type, 'revolute');
    assert.equal(joints[1].lower, -2.96);
    assert.equal(joints[1].upper, 2.96);
  });

  it('classifies real GLB mesh names into L1, L2, and L3 layers', () => {
    assert.equal(classifyMeshLayer('base_link'), 'L1');
    assert.equal(classifyMeshLayer('front_left'), 'L1');
    assert.equal(classifyMeshLayer('f_front_left'), 'L2');
    assert.equal(classifyMeshLayer('link_2'), 'L2');
    assert.equal(classifyMeshLayer('oberon7_upper_arm'), 'L2');
    assert.equal(classifyMeshLayer('link_1_motor'), 'L3');
    assert.equal(classifyMeshLayer('lidar'), 'L3');
    assert.equal(classifyMeshLayer('ping360_sonar'), 'L3');
    assert.equal(classifyMeshLayer('rtg'), 'L3');
  });

  it('computes Ghost Context material state (opacity: 0.12, transparent: true, depthWrite: false) for non-focused layers', () => {
    const l0State = computeGhostMaterialState('L1', 'L0', false, false, false);
    assert.equal(l0State.opacity, 1.0);
    assert.equal(l0State.transparent, false);
    assert.equal(l0State.depthWrite, true);

    const ghostState = computeGhostMaterialState('L1', 'L2', false, false, false);
    assert.equal(ghostState.opacity, 0.12);
    assert.equal(ghostState.transparent, true);
    assert.equal(ghostState.depthWrite, false);

    const focusedState = computeGhostMaterialState('L2', 'L2', false, false, false);
    assert.equal(focusedState.opacity, 1.0);
    assert.equal(focusedState.transparent, false);
    assert.equal(focusedState.depthWrite, true);
  });

  it('filters repositories by keyword and category', () => {
    const sample: ManifestRepo[] = [
      {
        category: '01-履带越障搜救机器人',
        repository: 'Search-and-Rescue-Robot',
        description: '履带搜救车 + AR4 机械臂',
        upstreamUrl: 'https://github.com/example/sar',
        primaryBaselineFile: 'urdf/sar_urdf.urdf',
        kinematicFileCount: 3,
        docFileCount: 2,
        kinematicFiles: ['urdf/sar_urdf.urdf'],
        docFiles: ['README.md']
      },
      {
        category: '03-宇树Unitree四足与人形全系_URDF',
        repository: 'unitree_ros',
        description: 'Unitree Go2 & G1 URDF',
        upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
        primaryBaselineFile: 'robots/go2_description/urdf/go2_description.urdf',
        kinematicFileCount: 41,
        docFileCount: 5,
        kinematicFiles: ['robots/go2_description/urdf/go2_description.urdf'],
        docFiles: ['README.md']
      }
    ];
    assert.equal(filterRepositories(sample, 'unitree').length, 1);
    assert.equal(filterRepositories(sample, 'ar4').length, 1);
  });

  it('parses kinematic stats and computes clip plane constant', () => {
    const stats = parseKinematicStats('<robot><link name="a"/><joint name="j1" type="revolute"/></robot>', 'robot.urdf');
    assert.equal(stats.linkCount, 1);
    assert.equal(stats.jointCount, 1);
    assert.ok(computeClipPlaneConstant(-1, 1, 1.0) > computeClipPlaneConstant(-1, 1, 0.2));
  });
});
