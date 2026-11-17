'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let preference;
try { preference = localStorage.getItem('ak-folio-motion'); } catch {}
let enabled = preference ? preference === 'on' : !reduced.matches;
html.classList.add('js');
const motion = $('#motion');
const setMotion = (value) => {
  enabled = value;
  html.dataset.motion = value ? 'on' : 'off';
  motion.setAttribute('aria-pressed', String(!value));
  motion.setAttribute('aria-label', value ? 'Pause motion' : 'Resume motion');
  $('#motion-text').textContent = value ? 'MOTION ON' : 'MOTION OFF';
  window.dispatchEvent(new Event('motionchange'));
};
setMotion(enabled);
motion.addEventListener('click', () => {
  preference = enabled ? 'off' : 'on';
  try { localStorage.setItem('ak-folio-motion', preference); } catch {}
  setMotion(!enabled);
});
reduced.addEventListener('change', (event) => { if (!preference) setMotion(!event.matches); });

const reveals = $$('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }), {threshold: .06});
  reveals.forEach((node) => revealObserver.observe(node));
  document.addEventListener('focusin', (e) => e.target.closest?.('.reveal')?.classList.add('visible'));
} else reveals.forEach((n) => n.classList.add('visible'));

const menu = $('.menu-toggle');
const nav = $('#nav');
function toggleMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
}
menu.addEventListener('click', () => toggleMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });
document.addEventListener('click', (e) => { if (!e.target.closest('.header-inner')) toggleMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false); menu.focus();
  }
});
matchMedia('(max-width: 540px)').addEventListener('change', () => toggleMenu(false));
const navLinks = $$('#nav a');
const locs = navLinks.map(a => $(a.getAttribute('href')));
const bar = $('.scroll-meter');
let queued = false;
function progress() {
  queued = false;
  const end = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = 'scaleX(' + (end > 0 ? Math.min(1, scrollY / end) : 0) + ')';
  let active = -1;
  locs.forEach((node, index) => {
    if (node.getBoundingClientRect().top <= innerHeight * .40) active = index;
  });
  if ($('#contact').getBoundingClientRect().top <= innerHeight * .40) active = -1;
  navLinks.forEach((link, idx) => {
    if (idx === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
const queueProgress = () => { if (!queued) { queued = true; requestAnimationFrame(progress); } };
window.addEventListener('scroll', queueProgress, {passive:true});
window.addEventListener('resize', queueProgress);
$$('details').forEach((item) => item.addEventListener('toggle', queueProgress));
progress();

const projects = [
  { id: 'construction', title: 'Prajapati Construction', label: '01 / BUSINESS WEBSITE', intro: 'A construction homepage build that introduces the business, makes its services easy to scan, and guides visitors to the projects.', points: ['A straightforward navigation bar with a Get a Quote call to action.', 'An architectural hero with the Built to stand out headline and a View Projects button.', 'A three-card service overview for residential, commercial, and renovation work.'] },
  { id: 'friendora', title: 'Friendora', label: '02 / SOCIAL LANDING PAGE', intro: 'A homepage for a friend-making website, designed to explain the idea and invite people to join.', points: ['A prominent Make New Friends headline and a clear Join Now button.', 'Simple navigation with Features, How it works, and Privacy.', 'A pink and purple palette that ties the brand mark, background and buttons together.'] },
  { id: 'sneaker', title: 'Sneaker Store', label: '03 / E-COMMERCE PRACTICE BUILD', intro: 'A Bootstrap practice project exploring how a sneaker store can guide visitors from a featured drop to a product collection.', points: ['A recognizable storefront header with Shop, New Arrivals, and a bag indicator.', 'A hero that introduces the collection and leads with a Shop Now button.', 'A three-product grid with color variants and sample prices to show the browsing layout.'] }
];
const caseDialog = $('#case-study');
let current = 0;
const opener = new WeakMap();
function showDialog(dialog, source) {
  opener.set(dialog, source);
  dialog.showModal();
  $('.dialog-close', dialog).focus({preventScroll:true});
}
for (const dialog of [caseDialog]) {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  let outside = false;
  dialog.addEventListener('pointerdown', e => { outside = e.target === dialog; });
  dialog.addEventListener('click', e => { if (e.target === dialog && outside) dialog.close(); outside = false; });
  dialog.addEventListener('close', () => opener.get(dialog)?.focus({preventScroll:true}));
}
function renderProject(index) {
  current = index;
  const item = projects[index];
  $('#case-label').textContent = item.label;
  $('#case-title').textContent = item.title;
  $('#case-intro').textContent = item.intro;
  const artwork = $('[data-project="' + item.id + '"] .project-media').cloneNode(true);
  $('#case-art-label').textContent = item.id === 'friendora' ? 'HOMEPAGE SCREENSHOT' : item.id === 'sneaker' ? 'STOREFRONT PREVIEW' : 'HOMEPAGE PREVIEW';
  $('#case-art').replaceChildren(artwork);
  $('#case-points').replaceChildren(...item.points.map((p) => {
    const li = document.createElement('li'); li.textContent = p; return li;
  }));
  caseDialog.scrollTop = 0;
}
$$('[data-project]').forEach(button => button.addEventListener('click', () => {
  renderProject(projects.findIndex(x => x.id === button.dataset.project));
  showDialog(caseDialog, button);
}));
$('#next-project').addEventListener('click', () => {
  renderProject((current + 1) % projects.length);
  const heading = $('#case-title');
  heading.tabIndex = -1;
  heading.focus({preventScroll:true});
});
const contactForm = $('#contact-form');
const localContactNote = $('#contact-local');
if (location.protocol === 'file:') {
  localContactNote.hidden = false;
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    localContactNote.focus();
  });
}

function mountKnot() {
  const canvas = $('#knot');
  const frame = canvas.parentElement;
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, powerPreference:'low-power'});
  if (!gl) return;
  const attribute = (type, source) => {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, attribute(gl.VERTEX_SHADER, `
attribute vec3 point; attribute vec3 normal;
uniform vec3 angles;
varying vec3 n; varying vec3 position;
vec3 turn(vec3 p) {
  float c=cos(angles.x), s=sin(angles.x);
  p.yz=mat2(c,s,-s,c)*p.yz;
  c=cos(angles.y); s=sin(angles.y);
  p.xz=mat2(c,-s,s,c)*p.xz;
  c=cos(angles.z); s=sin(angles.z);
  p.xy=mat2(c,s,-s,c)*p.xy;
  return p;
}
void main() {
  position=turn(point);
  n=turn(normal);
  float w=1.0-position.z*0.097;
  gl_Position=vec4(position.xy*0.278,-position.z*0.23,w);
}`));
  gl.attachShader(program, attribute(gl.FRAGMENT_SHADER, `
precision mediump float;
varying vec3 n; varying vec3 position;
float strip(vec3 r, vec3 l, float w) {
  float d=max(0.0,dot(r,normalize(l)));
  return pow(d,w);
}
void main() {
  vec3 N=normalize(n);
  vec3 V=normalize(vec3(0.,0.,8.5)-position);
  vec3 R=reflect(-V,N);
  float e=pow(1.0-max(0.0,dot(N,V)),3.0);
  float soft=strip(R,vec3(-.5,.8,.4),2.3);
  float key=strip(R,vec3(-.56,.82,.24),19.);
  float hot=strip(R,vec3(-.36,.94,.26),85.);
  float rim=strip(R,vec3(.83,.3,-.04),22.);
  float floorLight=strip(R,vec3(-.18,-1.,.35),12.);
  float band=pow(max(0.0,1.0-abs(R.y-.26)*1.27),17.) * smoothstep(-.65,.0,R.x);
  float diffuse=max(0.0,dot(N,normalize(vec3(-.8,1.,.2))));
  vec3 C=vec3(.12,.030,.009)+diffuse*vec3(.24,.083,.023);
  C+=soft*vec3(.35,.128,.026)+key*vec3(.86,.57,.29)+hot*vec3(.58,.57,.53);
  C+=rim*vec3(.72,.36,.108)+floorLight*vec3(.26,.108,.035)+band*vec3(.57,.29,.105);
  C+=e*vec3(.25,.11,.045);
  C*=.92+.08*sin(position.x*4.+position.y*6.);
  gl_FragColor=vec4(pow(C,vec3(.76)),1.0);
}`));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const tau = Math.PI * 2, path = 212, slices = 48;
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const len = Math.hypot(...a); return a.map(x=>x/len); };
  const curve = t => { const rad=1.79 + .66*Math.cos(3*t); return [rad*Math.cos(2*t),rad*Math.sin(2*t),.83*Math.sin(3*t)]; };
  const vertices = [], indices = [];
  for(let i=0;i<=path;i++){
    const t=tau*i/path, c=curve(t), b=curve(t+.001), a=curve(t-.001);
    const tangent=unit(b.map((x,j)=>x-a[j]));
    const A=unit(cross(tangent,[0,0,1]));
    const B=unit(cross(tangent,A));
    for(let j=0;j<=slices;j++){
      const v=tau*j/slices, wiggle=1+.085*Math.cos(3*v+2*t);
      const n=A.map((x,k)=>x*Math.cos(v)+B[k]*Math.sin(v));
      const p=c.map((x,k)=>x+(.49+.045*Math.cos(3*t))*wiggle*n[k]);
      const n2=A.map((x,k)=>x*Math.cos(v-.12*Math.sin(3*v+2*t))+B[k]*Math.sin(v-.12*Math.sin(3*v+2*t)));
      vertices.push(...p,...n2);
      if(i<path && j<slices){
        const h=i*(slices+1)+j, next=h+slices+1;
        indices.push(h,next,h+1,h+1,next,next+1);
      }
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  ['point','normal'].forEach((key,i)=>{
    const pos=gl.getAttribLocation(program,key);
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,i*12);
  });
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  const angles=gl.getUniformLocation(program,'angles');
  let raf=0, inView=true, lost=false, last=0, elapsed=0, mx=0, my=0, dx=0, dy=0;
  function resize() {
    const size=Math.max(1,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,1.65)));
    if (canvas.width!==size) { canvas.width=size; canvas.height=size; }
    gl.viewport(0,0,size,size);
    draw();
  }
  function draw() {
    if (lost) return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3f(angles,.33+(enabled ? Math.sin(elapsed*.6)*.18+dy*.40 : 0),-.23+(enabled ? Math.sin(elapsed*.49)*.27+dx*.55 : 0),-.42+(enabled ? elapsed*.17 : 0));
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  }
  function anim(time) {
    raf=0;
    if (!enabled || !inView || document.hidden || lost) {last=0; return;}
    if (last) elapsed+=Math.min((time-last)/1000,.035);
    last=time;
    dx+=(mx-dx)*.045; dy+=(my-dy)*.045;
    draw();
    raf=requestAnimationFrame(anim);
  }
  function update() {
    if (raf) cancelAnimationFrame(raf);
    raf=0; last=0;
    draw();
    if (enabled && inView && !document.hidden && !lost) raf=requestAnimationFrame(anim);
  }
  frame.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch') return;
    const box=frame.getBoundingClientRect();
    mx=(e.clientX-box.left)/box.width-.5; my=(e.clientY-box.top)/box.height-.5;
  },{passive:true});
  frame.addEventListener('pointerleave',()=>{mx=0;my=0;});
  canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();lost=true;update();frame.classList.remove('rendered'); enableBakedMotion();});
  window.addEventListener('motionchange',update);
  document.addEventListener('visibilitychange',update);
  if('ResizeObserver' in window) new ResizeObserver(resize).observe(frame);
  else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window) new IntersectionObserver(([r])=>{inView=r.isIntersecting;update();}).observe(frame);
  resize(); frame.classList.add('rendered'); update();
}
let bakedReady = false;
function enableBakedMotion() {
  if (bakedReady) return;
  bakedReady = true;
  const art = $('.knot-fallback');
  const still = 'assets/knot-poster.webp';
  const animated = 'assets/knot-motion.webp';
  let loaded = false;
  let loading = false;
  function update() {
    if (!enabled) { art.src = still; return; }
    if (loaded) { art.src = animated; return; }
    if (loading) return;
    loading = true;
    const loader = new Image();
    loader.onload = () => { loaded = true; loading = false; if (enabled) art.src = animated; };
    loader.onerror = () => { loading = false; };
    loader.src = animated;
  }
  window.addEventListener('motionchange', update);
  update();
}
try { mountKnot(); } catch {}
if (!$('canvas').parentElement.classList.contains('rendered')) enableBakedMotion();
