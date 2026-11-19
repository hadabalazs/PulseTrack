import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json';

const font = new Font(fontData);
function polygon(points) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));shape.closePath();return shape;
}
function regular(n, r, phase = Math.PI / 2) { return polygon(Array.from({ length: n }, (_, i) => [Math.cos(phase + i * Math.PI * 2 / n) * r, Math.sin(phase + i * Math.PI * 2 / n) * r])); }
function raised(group, shape, material, depth = .14, z = 0, bevel = .035) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 5, bevelSize: bevel, bevelThickness: bevel, curveSegments: 36, steps: 1 });
  const mesh = new THREE.Mesh(geometry, material);mesh.position.z = z;group.add(mesh);return mesh;
}
function roundLayer(group, r, material, depth, z, bevel = .04) {
  const profile = [new THREE.Vector2(0, -bevel), new THREE.Vector2(r, -bevel)];
  for (let i = 1; i <= 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 24;profile.push(new THREE.Vector2(r + bevel * Math.cos(a), bevel * Math.sin(a))); }
  profile.push(new THREE.Vector2(r + bevel, depth));
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 24;profile.push(new THREE.Vector2(r + bevel * Math.cos(a), depth + bevel * Math.sin(a))); }
  profile.push(new THREE.Vector2(0, depth + bevel));
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 192), material);mesh.rotation.x = Math.PI / 2;mesh.position.z = z;group.add(mesh);return mesh;
}
function line(group, points, material, radius = .025, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, radius, 12, closed), material);group.add(mesh);return mesh;
}
function rivet(group, x, y, z, material, r = .04) { const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), material);mesh.position.set(x, y, z);group.add(mesh); }
const pulsePoints = [[-.67,-.04],[-.3,-.04],[-.08,.51],[.05,-.36],[.24,.15],[.38,-.04],[.67,-.04],[.67,-.14],[.34,-.14],[.26,-.03],[.01,-.63],[-.14,.18],[-.25,-.14],[-.67,-.14]];
function pulse(group, material, scale = 1, z = .27) { const mesh = raised(group, polygon(pulsePoints), material, .075, z, .018);mesh.scale.set(scale, scale, 1);return mesh; }
function number(group, text, material, width = 1.35, height = .68, y = 0, z = .31) {
  const geometry = new THREE.ExtrudeGeometry(font.generateShapes(String(text), 1), { depth: .09, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 4, curveSegments: 16 });
  geometry.computeBoundingBox();const bounds = geometry.boundingBox;
  const size = new THREE.Vector3();bounds.getSize(size);const center = new THREE.Vector3();bounds.getCenter(center);geometry.translate(-center.x, -center.y, 0);
  const scale = Math.min(width / size.x, height / size.y);const mesh = new THREE.Mesh(geometry, material);mesh.scale.set(scale, scale, 1);mesh.position.set(0, y, z);group.add(mesh);
}
function materials(tier) {
  const finishes = {
    bronze: { color: '#bb7544', roughness: .2 },
    silver: { color: '#d6dee8', roughness: .16 },
    gold: { color: '#efb83e', roughness: .17 },
    platinum: { color: '#dbeafa', roughness: .1, iridescence: .28, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 300] },
  };
  const finish = finishes[tier] || finishes.bronze;
  const physical = (color, props = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: .35, roughness: .23, clearcoat: 1, clearcoatRoughness: .12, ...props });
  return {
    metal: physical(finish.color, { metalness: 1, clearcoat: .25, ...finish }),
    mint: physical('#1fc795'), blue: physical('#1044d6'), navy: physical('#10264e'), purple: physical('#651ac4'), green: physical('#059555'),
    rainbow: physical(finish.color, { metalness: 1, clearcoat: .35, ...finish }),
  };
}

export function createMedal(definition) {
  const group = new THREE.Group(), m = materials(definition.metal), recipe = definition.recipe, value = definition.value;
  if (recipe === 'pulse' || recipe === 'return') {
    raised(group, regular(6, 1.14), m.metal, .22, -.13, .075);raised(group, regular(6, .99), m.mint, .055, .15, .035);pulse(group, m.metal, .93);
    const count = definition.family === 'weekly' ? value : 1;
    if (definition.family === 'lifetime' && value > 1) number(group, value, m.metal, .75, .24, -.65, .28);
    else for (let i = 0; i < count; i++) rivet(group, (i - (count - 1) / 2) * .19, -.67, .28, m.metal);
  } else if (recipe === 'streak') {
    roundLayer(group, 1.12, m.metal, .24, -.14, .055);
    roundLayer(group, .99, definition.cadence === 'daily' ? m.navy : definition.cadence === 'weekly' ? m.purple : m.green, .055, .15, .025);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6;rivet(group, Math.cos(a) * .87, Math.sin(a) * .87, .27, m.metal, .024); }
    if (definition.cadence === 'daily') {
      const flame = new THREE.Shape();flame.moveTo(0,.86);flame.bezierCurveTo(.02,.48,.55,.43,.39,.06);flame.bezierCurveTo(.21,-.25,-.35,-.19,-.39,.12);flame.bezierCurveTo(-.48,.39,-.16,.48,-.17,.63);flame.bezierCurveTo(-.08,.56,-.08,.48,-.05,.43);flame.bezierCurveTo(.11,.57,-.07,.7,0,.86);
      raised(group, flame, m.metal, .07, .28, .022);
    } else if (definition.cadence === 'weekly') {
      for (const offset of [-.2,.2]) line(group, Array.from({length:48},(_,i)=>{ const a=i/48*Math.PI*2;return [offset+Math.cos(a)*.29,.35+Math.sin(a)*.19,.34]; }), m.metal, .065, true);
    } else {
      const star = polygon(Array.from({length:10},(_,i)=>{ const a=Math.PI/2+i*Math.PI/5,r=i%2?.19:.4;return [Math.cos(a)*r,.35+Math.sin(a)*r]; }));
      raised(group, star, m.metal, .07, .28, .018);
    }
    number(group, value, m.metal, 1.12, .43, -.49, .3);
  } else if (recipe === 'orbit') {
    roundLayer(group, 1.12, m.metal, .24, -.14, .055);roundLayer(group, 1.01, m.blue, .05, .15, .025);
    for (let i = 0; i < value; i++) {
      const a = i * Math.PI * 2 / value, b = a + Math.PI * 2 / value * .65, shape = new THREE.Shape();
      shape.absarc(0, 0, .93, a, b, false);shape.lineTo(Math.cos(b) * .76, Math.sin(b) * .76);shape.absarc(0, 0, .76, b, a, true);shape.closePath();raised(group, shape, m.metal, .045, .24, .012);
    }
    number(group, value, m.metal, 1.3, .72);
  } else if (recipe === 'sun' || recipe === 'anniversary') {
    const star = polygon(Array.from({ length: 24 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 12, r = i % 2 ? 1.02 : 1.24;return [Math.cos(a) * r, Math.sin(a) * r]; }));
    raised(group, star, m.metal, .2, -.13, .035);roundLayer(group, .91, m.metal, .08, .13);roundLayer(group, .82, m.navy, .04, .24, .025);number(group, value, m.metal, 1.32, .59, 0, .32);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6;rivet(group, Math.cos(a) * .72, Math.sin(a) * .72, .33, m.metal, .017); }
  } else if (recipe === 'infinity') {
    roundLayer(group, 1.1, m.metal, .23, -.14, .055);roundLayer(group, .98, m.purple, .055, .15, .035);
    line(group, Array.from({ length: 160 }, (_, i) => { const t = i / 160 * Math.PI * 2;return [Math.sin(t) * .83, Math.sin(2 * t) * .36, .37 + Math.cos(t) * .12]; }), m.rainbow, .135, true);
    number(group, value, m.metal, .75, .22, -.67, .3);
  } else if (recipe === 'leaf') {
    const shape = new THREE.Shape();shape.moveTo(-.75, -.98);shape.bezierCurveTo(-1.2, .15, -.35, .82, .8, 1.07);shape.bezierCurveTo(.79, .25, .81, -.79, -.75, -.98);
    raised(group, shape, m.metal, .21, -.13);const inset = raised(group, shape, m.green, .07, .13, .025);inset.scale.set(.91, .91, 1);
    line(group, [[-.71,-.89,.28],[-.32,-.39,.32],[.15,.15,.33],[.72,.96,.27]], m.metal);
    [[[-.45,-.57,.3],[-.66,-.1,.29],[-.7,.13,.27]],[[-.15,-.2,.32],[-.38,.28,.3],[-.35,.55,.27]],[[.16,.17,.32],[.05,.62,.3],[.16,.77,.27]],[[-.39,-.48,.32],[.06,-.49,.3],[.35,-.35,.27]],[[-.05,-.08,.33],[.43,-.08,.3],[.58,.12,.27]]].forEach(points => line(group, points, m.metal, .018));
  } else if (recipe === 'prism') {
    raised(group, regular(6, 1.15), m.metal, .21, -.13, .04);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 2 + i * Math.PI / 3, b = a + Math.PI / 3;
      raised(group, polygon([[0,0],[Math.cos(a), Math.sin(a)],[Math.cos(b), Math.sin(b)]]), [m.blue, m.mint, m.purple][i % 3], .09 + (i % 2) * .07, .14, .018);
    }
    number(group, value, m.metal, .55, .58, 0, .41);
  } else if (recipe === 'distance') {
    const shield = polygon([[-1,.8],[0,1.12],[1,.8],[.9,-.35],[.5,-.83],[0,-1.1],[-.5,-.83],[-.9,-.35]]);
    raised(group, shield, m.metal, .22, -.13, .045);const inner = raised(group, shield, m.blue, .05, .15, .025);inner.scale.set(.87,.87,1);
    raised(group, polygon([[-.5,.44],[0,.79],[.5,.44],[.5,.29],[0,.61],[-.5,.29]]), m.metal, .05, .28, .018);number(group, value, m.metal, 1.4, .52, -.18);
  } else if (recipe === 'sunrise') {
    roundLayer(group, 1.1, m.metal, .22, -.13);roundLayer(group, .96, m.navy, .05, .15, .025);
    const sun = roundLayer(group, .4, m.metal, .05, .26, .02);sun.position.y = -.1;
    for (let i = 0; i < 7; i++) { const a = i * Math.PI / 6;line(group, [[Math.cos(a) * .58, Math.sin(a) * .58 - .1, .29],[Math.cos(a) * .82, Math.sin(a) * .82 - .1, .29]], m.metal, .026); }
    const horizon = raised(group, polygon([[-.85,-.16],[-.58,-.42],[0,-.6],[.58,-.42],[.85,-.16],[.7,-.66],[0,-.87],[-.7,-.66]]), m.blue, .04, .34, .018);horizon.position.y = -.02;
  }
  const reverse = new THREE.Group();pulse(reverse, m.metal, .55, 0);reverse.rotation.y = Math.PI;reverse.position.z = -.24;group.add(reverse);
  group.rotation.set(.12, -.22, -.035);
  // Dispose even unused recipe materials when the view is closed.
  group.userData.materials = Object.values(m);
  return group;
}

export function createStudio(renderer) {
  const studio = new THREE.Scene();studio.background = new THREE.Color().setRGB(.075, .09, .12);
  for (const { w,h,x,y,z,power } of [{w:2.7,h:6,x:-3.5,y:2,z:5,power:7},{w:.65,h:6,x:1.6,y:.5,z:5,power:10},{w:5,h:1.5,x:0,y:4,z:1,power:6},{w:2,h:5,x:4,y:0,z:-2,power:4},{w:5,h:2,x:-1,y:-4,z:2,power:.65}]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(power,power,power), side: THREE.DoubleSide }));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer), target = pmrem.fromScene(studio,.025,.1,100);
  studio.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose();if (!Array.isArray(object.material)) object.material.dispose(); } });pmrem.dispose();return target;
}

export function createView(model, environment) {
  const scene = new THREE.Scene();scene.environment = environment;
  const camera = new THREE.PerspectiveCamera(35,1,.1,50);camera.position.set(0,0,4.9);camera.lookAt(0,0,0);
  for (const { color,intensity,x,y,z } of [{color:'#ffffff',intensity:2.2,x:-3,y:5,z:6},{color:'#b7ceff',intensity:.65,x:4,y:-1,z:3},{color:'#fff0d3',intensity:1.2,x:1,y:3,z:-3}]) {
    const light = new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
  }
  scene.add(model);return { model, scene, camera };
}
export function disposeModel(model) {
  model.traverse(object => object.geometry?.dispose());model.userData.materials?.forEach(material => material.dispose());
}

// Development asset export uses exactly the production geometry and studio.
export function createPosterRenderer(size = 256) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(size,size);renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1.05;
  const environment = createStudio(renderer);
  return {
    render(definition) {
      const model = createMedal(definition), { scene, camera } = createView(model,environment.texture);
      renderer.setClearColor(0,0);renderer.render(scene,camera);const data = renderer.domElement.toDataURL('image/webp',.94);disposeModel(model);return data;
    },
    dispose() { environment.dispose();renderer.dispose();renderer.forceContextLoss(); },
  };
}
