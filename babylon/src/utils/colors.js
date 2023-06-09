import {
    Color3,
  } from "@babylonjs/core";

const r = [
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.6,
    0.0, 0.6, 0.6, 0.0, 0.6, 0.0, 0.6, 1.0, 1.0  
  ]
  
  const g = [
    0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.6, 0.0,
    0.6, 0.6, 0.0, 1.0, 1.0, 0.6, 0.0, 0.6, 0.0
  ]
  
  const b = [
    1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.6, 0.0, 0.0,
    0.6, 0.0, 0.6, 0.6, 0.0, 1.0, 1.0, 0.0, 0.6
  ]
  
  const jr = [
    0.0,
   -0.3,  0.3, -0.3,  0.3, -0.3,  0.3, -0.3,  0.3,  0.3,
   -0.3, -0.3,  0.3,  0.3, -0.3, -0.3,  0.3,  0.0,  0.0,
    0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.3, -0.3,
   -0.4,  0.4, -0.4,  0.4, -0.4,  0.4, -0.4,  0.4,  0.4,
   -0.4, -0.4,  0.4,  0.4, -0.4, -0.4,  0.4,  0.0,  0.0,
    0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.4, -0.4
  ]
  
  const jg = [
    0.0,
   -0.3,  0.3,  0.3, -0.3, -0.3,  0.3,  0.3, -0.3,  0.3,
   -0.3,  0.3, -0.3,  0.0,  0.0,  0.0,  0.0,  0.3, -0.3,
   -0.3,  0.3,  0.0,  0.0,  0.3, -0.3,  0.0,  0.0,
   -0.4,  0.4,  0.4, -0.4, -0.4,  0.4,  0.4, -0.4,  0.4,
   -0.4,  0.4, -0.4,  0.0,  0.0,  0.0,  0.0,  0.4, -0.4,
   -0.4,  0.4,  0.0,  0.0,  0.4, -0.4,  0.0,  0.0
  ]
  
  const jb = [
    0.0,
   -0.3,  0.3,  0.3, -0.3,  0.3, -0.3, -0.3,  0.3,  0.0,
    0.0,  0.0,  0.0,  0.3, -0.3,  0.3, -0.3,  0.3, -0.3,
    0.3, -0.3,  0.3, -0.3,  0.0,  0.0,  0.0,  0.0,
   -0.4,  0.4,  0.4, -0.4,  0.4, -0.4, -0.4,  0.4,  0.0,
    0.0,  0.0,  0.0,  0.4, -0.4,  0.4, -0.4,  0.4, -0.4,
    0.4, -0.4,  0.4, -0.4,  0.0,  0.0,  0.0,  0.0
  ]
  
  function ramp(val) {
    return 0.5 + 0.5*Math.abs(1 - 2*val)
  }
  
  function getJitter(c, sub) {
    let j = 0;
    let x = 0;
  
    while (j < jr.length) {
      x = c.r + jr[j];
      if ((x < 0) || (x > 1)) {
        j++;
        continue;
      }
      x = c.g + jg[j];
      if ((x < 0) || (x > 1)) {
        j++;
        continue;
      }
      x = c.b + jb[j];
      if ((x < 0) || (x > 1)) {
        j++;
        continue;
      }
  
      if (sub == 0)
        break;
  
      sub--;
      j++;
    }
  
    if (j == jr.length) j = 0;
  
    let jit = { r: jr[j], g: jg[j], b: jb[j] }
    return jit;
  }
  
  export function pieceColor(index, instance=0) {
    let color = {}
    if (index < r.length) color = { r: r[index], g: g[index], b: b[index] }
    else color = { r: (1+Math.sin(0.7*index))/2, g: (1+Math.sin(1.3*index+1.5)/2), b: (1+Math.sin(3.5*index+2.3))/2}
    let jitter = getJitter(color, instance)
    let result = { r: color.r + jitter.r*0.5*ramp(color.r), g: color.g + jitter.g*0.4*ramp(color.g), b: color.b + jitter.b*0.7*ramp(color.b)}
    return new Color3(result.r, result.g, result.b)
  }