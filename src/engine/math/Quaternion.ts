/**
 * Quaternion Math Library for 6-DOF Aerospace Attitude Representation
 * 
 * Attitude convention: q = [w, x, y, z]
 * Where w is scalar part, (x, y, z) is vector part.
 * Avoids gimbal lock in full 3D attitude propagation.
 */

import { Vector3D } from './Vector3D';

export class Quaternion {
  constructor(
    public w: number = 1,
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}

  static identity(): Quaternion {
    return new Quaternion(1, 0, 0, 0);
  }

  clone(): Quaternion {
    return new Quaternion(this.w, this.x, this.y, this.z);
  }

  normalize(): Quaternion {
    const mag = Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    if (mag < 1e-12) return Quaternion.identity();
    const inv = 1.0 / mag;
    return new Quaternion(this.w * inv, this.x * inv, this.y * inv, this.z * inv);
  }

  conjugate(): Quaternion {
    return new Quaternion(this.w, -this.x, -this.y, -this.z);
  }

  multiply(q: Quaternion): Quaternion {
    // Hamilton product: this * q
    return new Quaternion(
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
      this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
    );
  }

  /**
   * Rotates a 3D vector by this quaternion: v' = q * v * q^(-1)
   */
  rotateVector(v: Vector3D): Vector3D {
    // Optimized formula: v' = v + 2 * r x (r x v + w * v) where r = (x, y, z)
    const rx = this.x, ry = this.y, rz = this.z;
    const rw = this.w;

    // t = 2 * (r x v)
    const tx = 2.0 * (ry * v.z - rz * v.y);
    const ty = 2.0 * (rz * v.x - rx * v.z);
    const tz = 2.0 * (rx * v.y - ry * v.x);

    // v' = v + w * t + (r x t)
    return new Vector3D(
      v.x + rw * tx + (ry * tz - rz * ty),
      v.y + rw * ty + (rz * tx - rx * tz),
      v.z + rw * tz + (rx * ty - ry * tx)
    );
  }

  /**
   * Creates a quaternion from an axis-angle rotation.
   * @param axis Normalized rotation axis
   * @param angleRadians Angle in radians
   */
  static fromAxisAngle(axis: Vector3D, angleRadians: number): Quaternion {
    const halfAngle = angleRadians * 0.5;
    const sinHalf = Math.sin(halfAngle);
    const normAxis = axis.normalize();
    return new Quaternion(
      Math.cos(halfAngle),
      normAxis.x * sinHalf,
      normAxis.y * sinHalf,
      normAxis.z * sinHalf
    ).normalize();
  }

  /**
   * Creates a quaternion from Euler angles (Tait-Bryan: Pitch, Yaw, Roll in radians).
   * Yaw (Z), Pitch (Y), Roll (X) sequence.
   */
  static fromEuler(pitchRad: number, yawRad: number, rollRad: number): Quaternion {
    const c1 = Math.cos(rollRad * 0.5);
    const s1 = Math.sin(rollRad * 0.5);
    const c2 = Math.cos(pitchRad * 0.5);
    const s2 = Math.sin(pitchRad * 0.5);
    const c3 = Math.cos(yawRad * 0.5);
    const s3 = Math.sin(yawRad * 0.5);

    return new Quaternion(
      c1 * c2 * c3 + s1 * s2 * s3,
      s1 * c2 * c3 - c1 * s2 * s3,
      c1 * s2 * c3 + s1 * c2 * s3,
      c1 * c2 * s3 - s1 * s2 * c3
    ).normalize();
  }

  /**
   * Converts quaternion to Euler angles in degrees (pitch, yaw, roll).
   */
  toEulerDegrees(): { pitch: number; yaw: number; roll: number } {
    // Roll (x-axis)
    const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis)
    const sinp = 2 * (this.w * this.y - this.z * this.x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = (Math.sign(sinp) * Math.PI) / 2; // Gimbal lock case
    } else {
      pitch = Math.asin(sinp);
    }

    // Yaw (z-axis)
    const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    const radToDeg = 180.0 / Math.PI;
    return {
      pitch: pitch * radToDeg,
      yaw: yaw * radToDeg,
      roll: roll * radToDeg
    };
  }

  /**
   * Computes quaternion time derivative from angular velocity vector:
   * dq/dt = 0.5 * q * [0, omega]
   */
  derivative(angularVelocity: Vector3D): [number, number, number, number] {
    const wx = angularVelocity.x;
    const wy = angularVelocity.y;
    const wz = angularVelocity.z;

    return [
      0.5 * (-this.x * wx - this.y * wy - this.z * wz),
      0.5 * ( this.w * wx + this.y * wz - this.z * wy),
      0.5 * ( this.w * wy - this.x * wz + this.z * wx),
      0.5 * ( this.w * wz + this.x * wy - this.y * wx)
    ];
  }
}
