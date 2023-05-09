uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform vec2 u_screen;
uniform float u_position;
uniform float u_max;
varying vec2 vUv;
void main() {
  float base_width = 2732.;
  float base_height = 1564.;
  float base_aspect = 1.746803069053708;
  float aspect = u_screen.x / u_screen.y;
  float su = 0.377745241581259;
  float eu = 0.869326500732064;
  float eu_su = 0.491581259150805;
  float sv = 0.214833759590793;
  float ev = 0.785166240409207;
  float ev_sv = 0.570332480818414;
  float su_su_1_eu = 0.742980561555075;
  vec2 uv = vUv;
  if(aspect / base_aspect > 1.) {
    float t0 = 1.0 / (ev - sv);
    uv.y = uv.y * t0 - sv * t0;
    float t1 = su_su_1_eu / u_screen.x;
    float su2 = u_screen.x * t1 - u_screen.y * 0.858695652173485 * t1;
    float t2 = 1.0 / u_screen.x;
    float eu2 = su2 + u_screen.y * 0.858695652173913 * t2;
    float t3 = 1.0 / (eu2 - su2);
    uv.x = uv.x * t3 - su2 * t3;
  } else {
    uv.x = uv.x * 2.034251675353687 - 0.768428890543559;
    float t0 = 0.5 / u_screen.y;
    sv = u_screen.y * t0 - u_screen.x * 0.326500732064421 * t0;
    ev = 1.0 - sv;
    float t1 = 1.0 / (ev - sv);
    uv.y = uv.y * t1 - sv * t1;
  }
  vec4 outColor = vec4(0.);
  float addpos = mod(u_position, 2.0 * u_max);
  uv.y -= addpos;
  outColor = texture2D(u_tex2, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));
  uv.y += 2.0;
  outColor += texture2D(u_tex1, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));
  uv.y += 2.0;
  outColor += texture2D(u_tex0, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));
  uv.y += 2.0;
  outColor += texture2D(u_tex2, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));
  gl_FragColor = outColor;
}