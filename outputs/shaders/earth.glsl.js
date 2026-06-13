export const proceduralEarthVertexShader = "varying vec3 v; varying vec3 wp; void main(){v=normalize(position); vec4 w=modelMatrix*vec4(position,1.0); wp=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}";

export const proceduralEarthFragmentShader = `
  varying vec3 v; varying vec3 wp; uniform float time;
  float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float noise(vec3 p){
    vec3 i=floor(p), f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){float v=0.0,a=.5; for(int i=0;i<6;i++){v+=a*noise(p); p=p*2.07+vec3(.6,.2,.9); a*=.5;} return v;}
  void main(){
    vec3 p=v*2.0;
    float warp=fbm(p*1.25+fbm(p*1.9+time*.01));
    float mask=fbm(p*1.62+warp*2.4);
    float veg=fbm(p*5.2+warp*1.1);
    float mountains=fbm(p*12.0+warp*2.0);
    float land=smoothstep(.515,.565,mask);
    vec3 ocean=mix(vec3(.039,.176,.322),vec3(.102,.424,.659),smoothstep(.48,.64,mask)+veg*.16);
    vec3 desert=vec3(.722,.600,.408);
    vec3 forest=vec3(.227,.420,.220);
    vec3 mountain=vec3(.420,.384,.345);
    float lat=abs(v.y);
    vec3 landColor=mix(forest,desert,smoothstep(.12,.64,lat)+veg*.22);
    landColor=mix(landColor,mountain,smoothstep(.62,.83,mountains)*land);
    landColor=mix(landColor,vec3(.96,.97,.94),smoothstep(.78,.88,lat));
    vec3 c=mix(ocean,landColor,land);
    c=mix(c,vec3(.98,.99,.96),smoothstep(.78,.88,lat));
    c*=.76+.36*max(dot(normalize(vec3(-.45,.42,.8)),v),0.0);
    gl_FragColor=vec4(c,1.0);
  }`;

export const proceduralCloudVertexShader = "varying vec3 v; void main(){v=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";

export const proceduralCloudFragmentShader = `
  varying vec3 v; uniform float time;
  float hash(vec3 p){return fract(sin(dot(p,vec3(17.1,91.7,47.7)))*43758.5453);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float v=0.0,a=.5; for(int i=0;i<5;i++){v+=a*noise(p); p=p*2.13+vec3(.3,.7,.5); a*=.5;} return v;}
  void main(){
    vec3 p=v*5.6+vec3(time*.02,0.,time*.013);
    float swirl=fbm(p+vec3(fbm(p*1.7),fbm(p*1.9),0.0)*1.6);
    float wisps=fbm(p*3.0+swirl);
    float systems=smoothstep(.58,.72,swirl)*smoothstep(.36,.68,wisps);
    float bands=smoothstep(.35,.95,sin(v.y*18.0+swirl*3.0)*.5+.5);
    float a=systems*(.22+.34*bands);
    gl_FragColor=vec4(vec3(.96,.98,1.0),a);
  }
`;

export const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main(){
    vUv=uv;
    vWorldNormal=normalize(mat3(modelMatrix)*normal);
    vec4 world=modelMatrix*vec4(position,1.0);
    vWorldPos=world.xyz;
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;

export const earthFragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D specMap;
  uniform sampler2D normalMap;
  uniform sampler2D nightMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main(){
    vec3 relief=texture2D(normalMap,vUv).rgb*2.0-1.0;
    vec3 normal=normalize(vWorldNormal + vec3(relief.xy*0.08, relief.z*0.015));
    vec3 viewDir=normalize(cameraPosition-vWorldPos);
    vec3 sunDir=normalize(uSunDir);
    vec3 dayColor=texture2D(dayMap,vUv).rgb;
    vec3 nightColor=texture2D(nightMap,vUv).rgb;
    float s=dot(normal,sunDir);
    float mixF=smoothstep(-0.12,0.25,s);
    vec3 color=mix(nightColor*1.4,dayColor,mixF);
    float oceanMask=texture2D(specMap,vUv).r;
    vec3 halfDir=normalize(sunDir+viewDir);
    float spec=pow(max(dot(normal,halfDir),0.0),64.0)*oceanMask*mixF;
    color+=vec3(0.88,0.94,1.0)*spec*0.22;
    float fres=pow(1.0-max(dot(normal,viewDir),0.0),2.5);
    color+=vec3(0.30,0.55,1.0)*fres*mixF*0.6;
    gl_FragColor=vec4(color,1.0);
  }
`;

export const atmosphereVertexShader = "varying vec3 vNormal; varying vec3 vWorldPos; void main(){vNormal=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vWorldPos=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}";

export const atmosphereFragmentShader = "varying vec3 vNormal; varying vec3 vWorldPos; void main(){vec3 viewDir=normalize(cameraPosition-vWorldPos); float i=pow(max(0.0,0.72-dot(normalize(vNormal),viewDir)),4.0); gl_FragColor=vec4(vec3(0.3,0.6,1.0)*i,i);}";
