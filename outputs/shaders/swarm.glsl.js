export const swarmVertexShader = `
  attribute float aRadius;
  attribute float aMinorRadius;
  attribute float aInclination;
  attribute float aNode;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aTint;
  uniform float uTime;
  uniform float uPointScale;
  varying float vTint;

  vec3 rotateX(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }

  vec3 rotateY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  void main() {
    float theta = aPhase + uTime * aSpeed;
    vec3 pos = vec3(cos(theta) * aRadius, 0.0, sin(theta) * aMinorRadius);
    pos = rotateX(pos, aInclination);
    pos = rotateY(pos, aNode);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float distanceScale = clamp(115.0 / max(12.0, -mv.z), 0.32, 2.25);
    gl_PointSize = uPointScale * distanceScale;
    vTint = aTint;
  }
`;

export const swarmFragmentShader = `
  uniform float uOpacity;
  varying float vTint;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float r = length(p);
    float core = smoothstep(0.34, 0.08, r);
    float rim = smoothstep(0.5, 0.38, r) * (1.0 - core);
    float alpha = (core + rim * 0.45) * uOpacity;
    vec3 gold = vec3(1.0, 0.72, 0.20);
    vec3 offWhite = vec3(0.92, 0.90, 0.80);
    vec3 color = mix(gold, offWhite, 0.25 + vTint * 0.28);
    color = mix(color, vec3(0.02, 0.025, 0.035), rim * 0.5);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;
