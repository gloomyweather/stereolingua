/** shared glsl snippets */
export const BEZ = /* glsl */ `
  vec3 bez3(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float it = 1.0 - t;
    return it*it*it*a + 3.0*it*it*t*b + 3.0*it*t*t*c + t*t*t*d;
  }
`;

/** soft visibility helpers: growth front, year horizon (ghosting), focus */
export const VIS = /* glsl */ `
  float growVis(float ty) { return smoothstep(uGrowY + 0.5, uGrowY - 0.5, ty); }
  float yearVis(float ty) { return mix(0.08, 1.0, smoothstep(uYearY + 0.35, uYearY - 0.35, ty)); }
`;
