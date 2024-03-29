bgShader = `

uniform float time;
uniform vec2 resolution;

varying vec2 vUv;
varying vec3 vPosition;
void main()	{
    float x = vUv.x - 1. / 2.;
    float y = vUv.y - 1. / 2.;
    if (resolution.y < resolution.x) {
        x *= resolution.x / resolution.y;
    } else {
        y *= resolution.y / resolution.x;
    }
    float dist = x * x + y * y;
    float distorted = (fbm(vec3(0., 0., time/300.)) + 1.) / 2. * x * x + (fbm(vec3(1., 0., time/300.)) + 1.) / 2. * y * y;
    vec3 color = vec3(0.);
    if (dist < 0.003) {
        color += vec3(1.0 - (dist - 0.0005)/0.0007);
    }
    if (color.x < 0.0) {
        color = vec3(0.0);
    }
    if (distorted < 0.08) {
        color = (color + vec3(1.0 - distorted/0.001)) / 2.;
    }
    gl_FragColor = vec4(color, 1.);
}

`