// Havana Malecón's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// seafront boulevard in the late afternoon. The rider takes the inland lanes; across the
// oncoming lanes, where classic American cars cruise by in two-tone paint, the promenade runs
// along the seawall, where fishermen cast and couples stroll, and the sea surges against it,
// throwing spray over the wall in bursts and falling still between them. Pastel façades with
// colonnades, balconies and peeling plaster line the right, palms stand among them, and El
// Morro's castle and lighthouse guard the harbour mouth ahead across the water. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The Malecón repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
/** The oncoming lanes' width, the promenade's, the seawall's height and the sea below it. */
const LANES = 7;
const PROMENADE = 5;
const WALL = 0.85;
const SEA = 1.6;
/** The surges: each breaks over the wall for SURGE seconds of every CYCLE. */
const CYCLE = 8;
const SURGE = 3.2;

const CARS = [
  ['#e8455a', '#f5f1e8'],
  ['#2ec4b6', '#f5f1e8'],
  ['#ffd23f', '#f5f1e8'],
  ['#3a86ff', '#f5f1e8'],
  ['#f15bb5', '#f5f1e8'],
  ['#ff9f1c', '#2a2a2e'],
  ['#7ae582', '#f5f1e8'],
  ['#b0b8c0', '#c8102e'],
] as const;

const STROLL_WEAR = {
  tops: ['#ffffff', '#f5f1e8', '#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff', '#f15bb5'],
  bottoms: ['#1b3a5c', '#e8c9a0', '#2f3e5c', '#f5f1e8', '#5a5f69'],
  skins: ['#e2b48c', '#c48a5f', '#8d5a3b', '#5a3a29', '#f0c8a0'],
};

interface Spray {
  readonly mesh: Mesh;
  readonly material: MeshStandardMaterial;
  readonly delay: number;
}

interface Stroller {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly heading: number;
  readonly phase: number;
}

export class HavanaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly cars: { mesh: Group; offset: number; speed: number }[] = [];
  private readonly sprays: Spray[] = [];
  private readonly strollers: Stroller[] = [];
  private people: Figures | null = null;
  private swell: Texture | null = null;
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addSeafront(roadHalf, points);
    this.addSpray(roadHalf);
    this.addFacades(roadHalf);
    this.addPalms(roadHalf);
    this.addCars(roadHalf);
    this.addPeople(roadHalf);
    this.addMorro(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.swell) this.swell.offset.x = Math.sin(seconds * 0.5) * 0.02;
    for (const spray of this.sprays) {
      // Each surge climbs over the wall, hangs and falls; then the sea is still till the next.
      const t = (((seconds + spray.delay) % CYCLE) + CYCLE) % CYCLE;
      const k = t < SURGE ? Math.sin((Math.PI * t) / SURGE) : 0;
      spray.mesh.visible = k > 0.02;
      spray.mesh.scale.set(1 + k * 0.6, 0.2 + k * 1.8, 1 + k * 0.4);
      spray.material.opacity = 0.85 * k;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the water lies under the seawall. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 1);
      position.setY(i * 2 + 1, p.height - SEA - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const car of this.cars) {
      const metres = loopMetres(car.offset + car.speed * this.time, s, LOOP, BEHIND);
      car.mesh.position.z = -metres;
      car.mesh.position.y = heightAt(Math.max(metres, 0));
    }
    const people = this.people;
    if (people) {
      this.strollers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = w.speed ? Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04 : 0;
        // Fishermen sit on the wall's top; strollers walk the promenade.
        const y = heightAt(Math.max(metres, 0)) + (w.speed ? KERB : WALL - 0.45);
        people.set(i, w.x, y, -metres, w.heading, 0.95, step);
      });
      people.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /**
   * The oncoming lanes with their centre line, the kerb, the promenade's paving, the seawall and
   * the sea beyond, and the pavement before the façades on the right.
   */
  private addSeafront(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(lanesTexture(), LANES, 12), roughness: 0.85 });
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.9 });
    const wall = this.material({ map: this.repeat(wallTexture(), 2, 2), roughness: 0.95 });
    const swell = this.repeat(seaTexture(), 30, 30);
    this.swell = swell;
    const sea = this.material({ map: swell, roughness: 0.12, metalness: 0.25 });
    const lanes = -r - LANES;
    const promenade = lanes - PROMENADE;
    this.ribbons.add(points, asphalt, [
      [-r, 0.004],
      [lanes, 0.004],
    ]);
    this.ribbons.add(points, paving, [
      [lanes, 0.004],
      [lanes - 0.05, KERB],
      [promenade, KERB],
    ]);
    // The seawall: its face to the promenade, its broad top, and its face down to the sea.
    this.ribbons.add(points, wall, [
      [promenade, KERB],
      [promenade, WALL],
      [promenade - 0.7, WALL],
      [promenade - 0.7, -SEA],
    ]);
    this.ribbons.add(points, sea, [
      [promenade - 0.7, -SEA],
      [promenade - 1400, -SEA],
    ]);
    this.ribbons.add(points, paving, [
      [r + 4, KERB],
      [r + 0.05, KERB],
      [r, 0.004],
    ]);
  }

  /** Spray thrown up over the seawall in surges, here and there along it. */
  private addSpray(roadHalf: number): void {
    const random = seeded(901);
    const plume = new IcosahedronGeometry(1, 2);
    plume.scale(1.6, 2.4, 2.6);
    plume.translate(0, 1.6, 0);
    this.disposables.push(plume);
    const x = -roadHalf - LANES - PROMENADE - 0.6;
    for (let offset = 14; offset < LOOP; offset += 14 + random() * 16) {
      const material = this.material({
        color: 0xf2f8fa,
        transparent: true,
        opacity: 0,
        roughness: 0.4,
        depthWrite: false,
      });
      const holder = new Group();
      const mesh = new Mesh(plume, material);
      mesh.position.y = WALL - 0.6;
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
      this.sprays.push({ mesh, material, delay: random() * CYCLE });
    }
  }

  /** The façades: three and four storeys, pastel and peeling, colonnaded at the foot. */
  private addFacades(roadHalf: number): void {
    const random = seeded(907);
    const pastels = [
      0xf2b5a0, 0x9ad4c8, 0xf5d77a, 0xa8c8f0, 0xf0a8c8, 0xc8e0a0, 0xf5e6d0, 0xe89a6a,
    ];
    const fronts = this.track(facadeTexture());
    fronts.wrapS = RepeatWrapping;
    fronts.wrapT = RepeatWrapping;
    const cornice = this.material({ color: 0xf5f1e8, roughness: 0.8 });
    for (let offset = 0; offset < LOOP;) {
      const width = 12 + random() * 14;
      const floors = 3 + Math.floor(random() * 2);
      const height = floors * 4.2;
      const map = fronts.clone();
      map.repeat.set(width / 8, floors / 4);
      map.offset.y = 1 - floors / 4;
      map.needsUpdate = true;
      this.track(map);
      const facade = this.material({
        map,
        color: pastels[Math.floor(random() * pastels.length)]!,
        roughness: 0.85,
      });
      const building = new Group();
      const body = new Mesh(this.unit, facade);
      body.scale.set(14, height, width - 0.3);
      body.position.set(7, height / 2, -width / 2);
      body.castShadow = true;
      const top = new Mesh(this.unit, cornice);
      top.scale.set(14.6, 0.5, width - 0.1);
      top.position.set(7, height + 0.25, -width / 2);
      building.add(body, top);
      this.group.add(building);
      this.props.push({ mesh: building, offset, x: roadHalf + 4 });
      offset += width;
    }
  }

  /** Royal palms standing along the pavement. */
  private addPalms(roadHalf: number): void {
    const random = seeded(911);
    const bark = this.material({ color: 0xbab0a0, roughness: 0.9 });
    const fronds = this.material({ color: 0x4a7a34, roughness: 0.9 });
    const trunk = new CylinderGeometry(0.22, 0.32, 11, 8);
    trunk.translate(0, 5.5, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 10; k++) {
      const frond = new ConeGeometry(0.35, 4, 4);
      frond.scale(1, 1, 0.2);
      frond.translate(0, 2, 0);
      frond.rotateZ(1.2);
      frond.rotateY((k / 10) * Math.PI * 2);
      frond.translate(0, 11, 0);
      parts.push(frond);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(trunk, crown);
    for (let offset = 8; offset < LOOP; offset += 30 + random() * 20) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark), new Mesh(crown, fronds));
      palm.children.forEach((c) => (c.castShadow = true));
      palm.scale.setScalar(0.85 + random() * 0.3);
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x: roadHalf + 2.4 });
    }
  }

  /**
   * Classic American cars cruising the oncoming lanes: long two-tone bodies with tail fins,
   * chrome bumpers and whitewall tyres.
   */
  private addCars(roadHalf: number): void {
    const random = seeded(919);
    const chrome = this.material({ color: 0xe8ecf0, roughness: 0.15, metalness: 1 });
    const tyre = this.material({ color: 0x1b1b1f, roughness: 0.8 });
    const glass = this.material({ color: 0x2a3640, roughness: 0.1, metalness: 0.4 });
    const wheel = new CylinderGeometry(0.36, 0.36, 0.24, 14);
    wheel.rotateZ(Math.PI / 2);
    const fin = new BoxGeometry(0.08, 0.3, 1.2);
    fin.translate(0, 0.15, 0);
    fin.rotateX(-0.15);
    this.disposables.push(wheel, fin);
    CARS.forEach(([body, roof], k) => {
      const paint = this.material({ color: body, roughness: 0.3, metalness: 0.3 });
      const top = this.material({ color: roof, roughness: 0.35, metalness: 0.2 });
      const car = new Group();
      const add = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(sx, sy, sz);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        car.add(mesh);
      };
      add(paint, 2, 0.62, 5.4, 0, 0.72, 0);
      add(top, 1.7, 0.5, 2.2, 0, 1.28, 0.3);
      add(glass, 1.74, 0.36, 2.0, 0, 1.24, 0.3);
      add(chrome, 2.06, 0.18, 0.12, 0, 0.5, -2.72);
      add(chrome, 2.06, 0.18, 0.12, 0, 0.5, 2.72);
      add(chrome, 2.02, 0.05, 5.3, 0, 0.82, 0);
      for (const x of [-0.92, 0.92]) {
        const f = new Mesh(fin, paint);
        f.position.set(x, 1.03, 2.1);
        car.add(f);
        for (const z of [-1.7, 1.7]) {
          const w = new Mesh(wheel, tyre);
          w.position.set(x, 0.36, z);
          car.add(w);
        }
      }
      // Oncoming in the far lanes, a few going the rider's way in the near one.
      const oncoming = k % 3 !== 2;
      car.rotation.y = oncoming ? Math.PI : 0;
      car.position.x = oncoming ? -roadHalf - (k % 2 ? 2 : 5.2) : -roadHalf - 1.8 + 0.4;
      this.group.add(car);
      this.cars.push({
        mesh: car,
        offset: k * 45 + random() * 20,
        speed: oncoming ? -(9 + random() * 4) : 6 + random() * 2,
      });
    });
  }

  /** Couples strolling the promenade, and fishermen sitting on the wall facing the sea. */
  private addPeople(roadHalf: number): void {
    const random = seeded(929);
    const promenade = -roadHalf - LANES;
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 7) {
      if (random() < 0.3) {
        this.strollers.push({
          offset,
          x: promenade - PROMENADE - 0.3,
          speed: 0,
          heading: Math.PI / 2,
          phase: 0,
        });
        continue;
      }
      const speed = (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5);
      this.strollers.push({
        offset,
        x: promenade - 0.8 - random() * (PROMENADE - 1.4),
        speed,
        heading: speed > 0 ? 0 : Math.PI,
        phase: random() * 6.3,
      });
    }
    for (let offset = 2; offset < LOOP; offset += 5 + random() * 9) {
      const speed = (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4);
      this.strollers.push({
        offset,
        x: roadHalf + 0.8 + random() * 1.2,
        speed,
        heading: speed > 0 ? 0 : Math.PI,
        phase: random() * 6.3,
      });
    }
    this.people = new Figures(
      this.group,
      this.disposables,
      this.strollers.length,
      STROLL_WEAR,
      937,
    );
  }

  /** El Morro across the harbour mouth ahead: the castle's walls on its rock, and its lighthouse. */
  private addMorro(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(wallTexture(), 8, 8),
      color: 0xd8c8a8,
      roughness: 0.95,
    });
    const rock = this.material({ color: 0x8a7a68, roughness: 1 });
    const lamp = this.material({ color: 0xfff4d0, emissive: 0xffe8a0, emissiveIntensity: 0.6 });
    const morro = new Group();
    const base = new Mesh(this.unit, rock);
    base.scale.set(130, 22, 70);
    base.position.y = 9 - SEA - 6;
    const walls = new Mesh(this.unit, stone);
    walls.scale.set(90, 12, 46);
    walls.position.y = 20;
    const tower = new CylinderGeometry(2.6, 4.2, 40, 12);
    tower.translate(0, 46, 0);
    const lantern = new CylinderGeometry(3, 3, 4, 12);
    lantern.translate(0, 68, 0);
    this.disposables.push(tower, lantern);
    const light = new Mesh(tower, stone);
    light.position.x = 36;
    const head = new Mesh(lantern, lamp);
    head.position.x = 36;
    // Battlements along the walls' top, and a bastion's corner at each end.
    for (let x = -42; x <= 42; x += 6) {
      const merlon = new Mesh(this.unit, stone);
      merlon.scale.set(3, 2.4, 46.5);
      merlon.position.set(x, 27.2, 0);
      morro.add(merlon);
    }
    for (const x of [-48, 48]) {
      const bastion = new Mesh(this.unit, stone);
      bastion.scale.set(16, 16, 16);
      bastion.rotation.y = Math.PI / 4;
      bastion.position.set(x, 22, 18);
      morro.add(bastion);
    }
    morro.add(base, walls, light, head);
    morro.position.set(-roadHalf - 330, 0, -1100);
    morro.rotation.y = 0.4;
    this.horizon.add(morro);
    this.group.add(this.horizon);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** The oncoming lanes: worn asphalt with a dashed lane line and the double centre line. */
function lanesTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#55565c', 941);
    g.fillStyle = 'rgba(240,240,230,0.8)';
    g.fillRect(4, 0, 4, 256);
    g.fillRect(12, 0, 4, 256);
    for (let y = 0; y < 256; y += 64) g.fillRect(128, y, 5, 32);
  });
}

/** The promenade's pale paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#cfc6b4', 947);
    g.fillStyle = 'rgba(60,50,40,0.3)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 128);
  });
}

/** The seawall's weathered, salt-stained concrete. */
function wallTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#d2cabb', 953);
    const random = seeded(967);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(80,90,80,${0.08 + random() * 0.14})`;
      g.fillRect(random() * 256, random() * 256, 4 + random() * 20, 30 + random() * 60);
    }
  });
}

/** The Gulf's deep blue water, flecked with whitecaps. */
function seaTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#1f6a96';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(971);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(200,235,250,${0.06 + random() * 0.16})`;
      g.fillRect(random() * 512, random() * 512, 3, 10 + random() * 26);
    }
    for (let i = 0; i < 120; i++) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(random() * 512, random() * 512, 3, 6 + random() * 10);
    }
  });
}

/**
 * Eight metres and four storeys of a façade, drawn in pale greys so the material's pastel tints
 * it: the colonnade's arches at the foot, tall shuttered windows with balconies above, cornice
 * lines, and plaster peeling to the brick.
 */
function facadeTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    g.fillStyle = '#f2f2f0';
    g.fillRect(0, 0, 256, 512);
    const random = seeded(977);
    // Peeling and stains.
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(150,110,90,${0.1 + random() * 0.25})`;
      g.beginPath();
      g.ellipse(
        random() * 256,
        random() * 512,
        6 + random() * 16,
        4 + random() * 10,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(90,90,80,0.1)';
      g.fillRect(random() * 256, random() * 512, 3, 40 + random() * 80);
    }
    // Upper floors: tall windows with green shutters and a balcony rail.
    for (let y = 12; y < 384; y += 128) {
      for (const x of [26, 154]) {
        g.fillStyle = '#2a3a3a';
        g.fillRect(x, y + 14, 76, 92);
        g.fillStyle = '#3f7a5a';
        g.fillRect(x, y + 14, 18, 92);
        g.fillRect(x + 58, y + 14, 18, 92);
        g.fillStyle = '#1d1f24';
        g.fillRect(x - 8, y + 92, 92, 4);
        for (let b = x - 8; b < x + 86; b += 8) g.fillRect(b, y + 92, 2, 22);
        g.fillRect(x - 8, y + 112, 92, 3);
      }
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(0, y + 118, 256, 8);
    }
    // The colonnade's arches at the foot, dark in their shade.
    g.fillStyle = '#3a3430';
    for (const x of [16, 144]) {
      g.beginPath();
      g.moveTo(x, 512);
      g.lineTo(x, 430);
      g.arc(x + 48, 430, 48, Math.PI, 0);
      g.lineTo(x + 96, 512);
      g.closePath();
      g.fill();
    }
  });
}
