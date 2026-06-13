export const swarmVertexShader = `
  attribute float aRadius;
  attribute float aInclination;
  attribute float aNode;
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uPointScale;
  varying float vTwinkle;

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
    vec3 pos = vec3(cos(theta) * aRadius, 0.0, sin(theta) * aRadius);
    pos = rotateX(pos, aInclination);
    pos = rotateY(pos, aNode);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float distanceScale = clamp(170.0 / max(8.0, -mv.z), 0.35, 3.2);
    gl_PointSize = uPointScale * distanceScale;
    vTwinkle = fract(sin(aPhase * 437.1 + aNode * 91.7) * 43758.5453);
  }
`;

export const swarmFragmentShader = `
  uniform float uOpacity;
  varying float vTwinkle;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float r = length(p);
    float core = smoothstep(0.5, 0.0, r);
    float halo = smoothstep(0.5, 0.18, r) * 0.32;
    vec3 gold = vec3(0.789, 0.635, 0.153);
    vec3 white = vec3(0.91, 0.91, 0.88);
    vec3 color = mix(gold, white, 0.45 + vTwinkle * 0.35);
    float alpha = (core + halo) * uOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;
