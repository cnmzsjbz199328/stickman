export interface Pose {
  armUpperL: number;
  armLowerL: number;
  armUpperR: number;
  armLowerR: number;
  legUpperL: number;
  legLowerL: number;
  legUpperR: number;
  legLowerR: number;
  bounce: number;
  bodyRotation: number;
  scaleY: number;
}

export const defaultPose: Pose = {
  armUpperL: Math.PI / 2,
  armLowerL: Math.PI / 2,
  armUpperR: Math.PI / 2,
  armLowerR: Math.PI / 2,
  legUpperL: Math.PI / 2,
  legLowerL: Math.PI / 2,
  legUpperR: Math.PI / 2,
  legLowerR: Math.PI / 2,
  bounce: 0,
  bodyRotation: 0,
  scaleY: 1
};

export interface Keyframe {
  t: number; // 0.0 to 1.0
  pose: Partial<Pose>;
  ease?: string; // 'linear', 'easeIn', 'easeOut', 'easeInOut'
}

export interface AnimationData {
  name: string;
  keyframes: Keyframe[];
}

export class Easing {
  static linear(t: number) { return t; }
  static easeIn(t: number) { return t * t; }
  static easeOut(t: number) { return t * (2 - t); }
  static easeInOut(t: number) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  
  static get(name?: string) {
    switch (name) {
      case 'easeIn': return Easing.easeIn;
      case 'easeOut': return Easing.easeOut;
      case 'easeInOut': return Easing.easeInOut;
      default: return Easing.linear;
    }
  }
}

export class AnimationSystem {
  static lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  static evaluate(anim: AnimationData, progress: number, basePose: Pose = defaultPose): Pose {
    const result = { ...basePose };
    if (!anim || !anim.keyframes || anim.keyframes.length === 0) return result;
    
    let k0 = anim.keyframes[0];
    let k1 = anim.keyframes[anim.keyframes.length - 1];
    
    if (progress <= k0.t) {
      Object.assign(result, k0.pose);
      return result;
    }
    if (progress >= k1.t) {
      Object.assign(result, k1.pose);
      return result;
    }

    for (let i = 0; i < anim.keyframes.length - 1; i++) {
      if (progress >= anim.keyframes[i].t && progress <= anim.keyframes[i+1].t) {
        k0 = anim.keyframes[i];
        k1 = anim.keyframes[i+1];
        break;
      }
    }

    if (k0 === k1 || k0.t === k1.t) {
      Object.assign(result, k0.pose);
      return result;
    }

    const localProgress = (progress - k0.t) / (k1.t - k0.t);
    const easeFn = Easing.get(k1.ease);
    const t = easeFn(localProgress);

    for (const key in k1.pose) {
      const k = key as keyof Pose;
      const val0 = k0.pose[k] !== undefined ? k0.pose[k]! : basePose[k];
      const val1 = k1.pose[k] !== undefined ? k1.pose[k]! : basePose[k];
      result[k] = this.lerp(val0, val1, t);
    }

    return result;
  }
  
  static blend(poseA: Pose, poseB: Partial<Pose>, weight: number = 1): Pose {
    const result = { ...poseA };
    for (const key in poseB) {
      const k = key as keyof Pose;
      if (poseB[k] !== undefined) {
        result[k] = this.lerp(poseA[k], poseB[k]!, weight);
      }
    }
    return result;
  }
}
