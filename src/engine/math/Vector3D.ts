/**
 * 3D Vector Math Library for Aerospace Flight Dynamics
 */

export class Vector3D {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static zero(): Vector3D {
    return new Vector3D(0, 0, 0);
  }

  clone(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  add(v: Vector3D): Vector3D {
    return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  addScaled(v: Vector3D, scale: number): Vector3D {
    return new Vector3D(this.x + v.x * scale, this.y + v.y * scale, this.z + v.z * scale);
  }

  subtract(v: Vector3D): Vector3D {
    return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s: number): Vector3D {
    return new Vector3D(this.x * s, this.y * s, this.z * s);
  }

  dot(v: Vector3D): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3D): Vector3D {
    return new Vector3D(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  normalize(): Vector3D {
    const mag = this.magnitude();
    if (mag < 1e-12) return new Vector3D(0, 0, 0);
    const inv = 1.0 / mag;
    return new Vector3D(this.x * inv, this.y * inv, this.z * inv);
  }

  distanceTo(v: Vector3D): number {
    return this.subtract(v).magnitude();
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  static fromArray(arr: [number, number, number] | number[]): Vector3D {
    return new Vector3D(arr[0] || 0, arr[1] || 0, arr[2] || 0);
  }
}
