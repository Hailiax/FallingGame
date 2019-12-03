cylinderShader = `

uniform float time;
uniform vec2 resolution;

varying vec3 vPosition;
varying vec2 vUv;
  
void main()	{
    float value = fbm(vec3(vPosition.x * 2., vPosition.y - time/50., vPosition.z * 2.));
    value += 1.;
    value /= 2.;
    value *= value;
    gl_FragColor = vec4(1.0, 1.0, 1.0, value * 2.);
}

`