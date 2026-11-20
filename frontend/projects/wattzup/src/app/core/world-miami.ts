// Miami Neon Nights, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the beachfront
// boulevard of a Miami night, the road still wet from a passing shower. On the right a row of
// pastel art deco hotels, their eyebrow ledges and rooflines traced in neon tubes of pink, cyan,
// violet and green, a tall blade sign on each spelling the hotel's name; royal palms line the
// sidewalk and convertibles wait at the kerb, tail lights glowing. On the left a low wall, the
// sand and the dark Atlantic, a moon path shimmering on it; ahead, across the bay, a skyline of
// towers lit floor by floor. People stroll the sidewalks between the clubs. The hotels and their
// names are invented. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  AdditiveBlending,
  BoxGeometry,
  ConeGeometry,
  DoubleSide,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import {
  BoxBuilder,
  canvasTexture,
  Figures,
  haloTexture,
  LifeguardTowers,
  loopMetres,
  Palms,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The boulevard repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The sea lies SEA metres below the road, from BEACH metres beyond the verge. */
const SEA = 1.4;
const BEACH = 26;
/** The hotels stand back FRONT metres from the road's edge. */
const FRONT = 9;
/** Side streets cross the boulevard on the right at these offsets, each STREET metres wide. */
const CROSSINGS = [118, 286] as const;
const STREET = 12;

/** Whether `offset` falls within a side street, give or take `margin` metres. */
function inCrossing(offset: number, margin = 0): boolean {
  const o = ((offset % LOOP) + LOOP) % LOOP;
  return CROSSINGS.some((c) => Math.abs(o - c) < STREET / 2 + margin);
}

/** The neon colours, each a tube's colour and how hard it glows. */
const NEON = [0xff3fb4, 0x2fe6ff, 0xb46bff, 0x5aff8a, 0xffd23f, 0xff6a3f] as const;
const PASTELS = [0xf4b8c8, 0xa8e0dc, 0xf8e0a8, 0xc8b8ec, 0xb8e4b0, 0xf6c8a4] as const;
const NAMES = ['AZURE', 'FLAMINGO', 'CORAL MOON', 'PALMETTO', 'SEABREEZE', 'STARLITE'] as const;

const NIGHT_WEAR = {
  tops: ['#ff4fa8', '#2fd3cf', '#f4f0e8', '#1d1f24', '#ffb23f', '#9a6bff', '#e8e8e8'],
  bottoms: ['#1d1f24', '#2a3a5a', '#f4f0e8', '#3a2a2a'],
  skins: ['#f1c9a5', '#c48a5f', '#8d5a3b', '#5a3a2a', '#e0b08a'],
};

export class MiamiStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly traffic: { mesh: Group; offset: number; speed: number }[] = [];
  private trafficX = 0;
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private chatting: Figures | null = null;
  private readonly standers: {
    offset: number;
    x: number;
    heading: number;
    phase: number;
    scale: number;
  }[] = [];
  private water: Texture | null = null;
  private glitter: Texture | null = null;
  private readonly signs: MeshStandardMaterial[] = [];
  private readonly beacons: Mesh[] = [];
  private readonly foam: MeshBasicMaterial[] = [];
  private readonly drops: { x: number; y: number; z: number; speed: number }[] = [];
  private rain: InstancedMesh | null = null;
  private readonly drop = new Matrix4();
  /** The signals' red, amber and green lamps. */
  private readonly lights: MeshStandardMaterial[] = [];
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flat = new PlaneGeometry(1, 1);
  private halo!: MeshBasicMaterial;

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.flat);
    this.halo = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(this.halo);
    this.addRoad(roadHalf, points);
    this.addHotels(roadHalf);
    this.addPalms(roadHalf);
    this.addLamps(roadHalf);
    this.addCars(roadHalf);
    this.addLifeguards(roadHalf);
    this.addCrossings(roadHalf);
    this.addPeople(roadHalf);
    this.addBay();
    this.addDrizzle();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // Each line of surf swells as its wave breaks and fades as it runs out, 2.6 s apart.
    this.foam.forEach((m, k) => {
      const phase = (((seconds / 7.8 + k / 3) % 1) + 1) % 1;
      m.opacity = 0.15 + 0.65 * Math.sin(phase * Math.PI) ** 2;
    });
    // The signals cycle: green 14 s, amber 3 s, red 13 s.
    const cycle = seconds % 30;
    const lit = cycle < 14 ? 2 : cycle < 17 ? 1 : 0;
    this.lights.forEach((m, i) => (m.emissiveIntensity = i === lit ? 3.5 : 0.08));
    // The drizzle falls and slants, each drop wrapping back to the top of its 14 m column.
    const rain = this.rain;
    if (rain) {
      this.drops.forEach((d, i) => {
        const y = (((d.y - seconds * d.speed) % 14) + 14) % 14;
        this.drop.makeRotationZ(0.12);
        this.drop.setPosition(d.x + y * 0.12, y, d.z);
        rain.setMatrixAt(i, this.drop);
      });
      rain.instanceMatrix.needsUpdate = true;
    }
    // The aircraft beacons on the spires blink, a second apart.
    this.beacons.forEach((b, k) => (b.visible = (seconds + k * 0.37) % 1.6 < 0.9));
    if (this.water) this.water.offset.set(seconds * 0.004, seconds * 0.002);
    if (this.glitter) this.glitter.offset.set(Math.sin(seconds * 0.7) * 0.01, seconds * 0.05);
    // The blade signs pulse, each on its own beat, as neon on a timer does.
    this.signs.forEach((m, k) => {
      m.emissiveIntensity = 2.2 + Math.max(0, Math.sin(seconds * (0.9 + k * 0.23) + k)) * 1.2;
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 2);
      position.setY(i * 2 + 1, p.height - SEA - 2);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const car of this.traffic) {
      const metres = loopMetres(car.offset - car.speed * this.time, s, LOOP, BEHIND);
      car.mesh.position.set(this.trafficX, heightAt(Math.max(metres, 0)), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const bob = Math.abs(Math.sin(this.time * 3 + p.phase)) * 0.04;
        crowd.set(
          i,
          p.x,
          heightAt(Math.max(metres, 0)) + 0.15 + bob,
          -metres,
          p.speed >= 0 ? 0 : Math.PI,
          0.98,
          0,
        );
      });
      crowd.commit();
    }
    const chatting = this.chatting;
    if (chatting) {
      this.standers.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        const sway = Math.sin(this.time * 1.3 + p.phase) * 0.12;
        chatting.set(
          i,
          p.x,
          heightAt(Math.max(metres, 0)) + 0.15,
          -metres,
          p.heading + sway,
          p.scale,
        );
      });
      chatting.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /**
   * The wet asphalt, the sidewalk and hotel forecourts on the right, and on the left the
   * promenade, the sand falling to the sea and the water itself.
   */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({
      map: this.repeat(roadTexture(), r * 2, 16),
      roughness: 0.25,
      metalness: 0.2,
    });
    const paving = this.material({
      map: this.repeat(pavingTexture(), 2.4, 2.4),
      roughness: 0.28,
      metalness: 0.12,
    });
    const promenade = this.material({
      map: this.repeat(promenadeTexture(), 4.75, 6),
      roughness: 0.3,
      metalness: 0.1,
    });
    const sand = this.material({ map: this.repeat(sandTexture(), 6, 6), roughness: 1 });
    const kerb = this.material({ color: 0xd8d4cc, roughness: 0.6 });
    this.ribbons.add(points, asphalt, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, kerb, [
      [r + 0.25, 0.15],
      [r, 0.15],
      [r, 0.01],
    ]);
    this.ribbons.add(points, paving, [
      [r + FRONT + 40, 0.16],
      [r + 0.25, 0.15],
    ]);
    this.ribbons.add(points, kerb, [
      [-r, 0.01],
      [-r, 0.15],
      [-r - 0.25, 0.15],
    ]);
    this.ribbons.add(points, promenade, [
      [-r - 0.25, 0.15],
      [-r - 5, 0.15],
    ]);
    // The low sea wall: pastel stucco panels between pilasters under a pale stone coping that
    // overhangs on the promenade side, with a strip of pink neon tucked under its lip.
    const wall = this.material({ map: this.repeat(seaWallTexture(), 0.6, 4), roughness: 0.8 });
    const coping = this.material({ color: 0xe8e2dc, roughness: 0.5 });
    const strip = this.material({ color: 0xff4fb8, emissive: 0xff4fb8, emissiveIntensity: 2.6 });
    this.ribbons.add(points, wall, [
      [-r - 5, 0.15],
      [-r - 5, 0.72],
    ]);
    this.ribbons.add(points, strip, [
      [-r - 4.94, 0.66],
      [-r - 4.94, 0.72],
    ]);
    this.ribbons.add(points, coping, [
      [-r - 4.86, 0.72],
      [-r - 4.86, 0.84],
      [-r - 5.64, 0.84],
      [-r - 5.64, 0.72],
      [-r - 5.5, 0.72],
      [-r - 5.5, -0.3],
    ]);
    this.ribbons.add(points, sand, [
      [-r - 5.5, -0.3],
      [-r - BEACH, -SEA + 0.1],
      [-r - BEACH - 4, -SEA - 0.4],
    ]);
    const water = this.track(seaTexture());
    water.wrapS = RepeatWrapping;
    water.wrapT = RepeatWrapping;
    water.repeat.set(1 / 16, 1 / 16);
    this.water = water;
    const sea = this.material({
      map: water,
      color: 0x8a9ac8,
      roughness: 0.08,
      metalness: 0.4,
      emissive: 0x141a3a,
      emissiveIntensity: 0.6,
    });
    this.ribbons.add(points, sea, [
      [-r - BEACH - 2, -SEA],
      [-r - 600, -SEA],
    ]);
    // The surf: three lines of foam rolling in, one after another, the nearest washing up
    // the wet sand; each brightens as its wave breaks and fades as it sinks back.
    const foamMap = this.track(foamTexture());
    foamMap.wrapS = RepeatWrapping;
    foamMap.wrapT = RepeatWrapping;
    foamMap.repeat.set(1 / 3, 1 / 24);
    for (const [near, far] of [
      [-r - BEACH - 1.2, -r - BEACH - 4],
      [-r - BEACH - 6, -r - BEACH - 8.5],
      [-r - BEACH - 13, -r - BEACH - 15],
    ] as const) {
      const foam = new MeshBasicMaterial({
        map: foamMap,
        color: 0xd8e0ff,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      this.disposables.push(foam);
      this.foam.push(foam);
      const mesh = this.ribbons.add(points, foam, [
        [near, -SEA + 0.03],
        [far, -SEA + 0.03],
      ]);
      mesh.renderOrder = 1;
      mesh.receiveShadow = false;
    }
  }

  /** The deco hotels, their neon-traced ledges and rooflines, and a blade sign on each. */
  private addHotels(roadHalf: number): void {
    const random = seeded(8101);
    const tube = new CylinderGeometry(0.07, 0.07, 1, 6);
    this.disposables.push(tube);
    const neon = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.6, roughness: 0.4 }),
    );
    const streaks = this.track(reflectionTexture());
    const reflections = NEON.map(
      (c) =>
        new MeshBasicMaterial({
          map: streaks,
          color: c,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
    );
    this.disposables.push(...reflections);
    const lobbies = [0, 1, 2, 3].map((v) =>
      this.material({
        map: this.track(lobbyTexture(8231 + v)),
        emissive: 0xffffff,
        emissiveMap: this.track(lobbyTexture(8231 + v)),
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.3,
      }),
    );
    const bulbs = this.material({
      map: this.track(bulbTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(bulbTexture()),
      emissiveIntensity: 2.4,
    });
    const tableTop = this.material({ color: 0xf4f0ec, roughness: 0.3 });
    const metal = this.material({ color: 0x2a2a30, roughness: 0.4, metalness: 0.7 });
    const chair = this.material({ color: 0xf4f0ec, roughness: 0.6 });
    const umbrella = new ConeGeometry(1.5, 0.6, 8, 1, true);
    umbrella.translate(0, 0.3, 0);
    this.disposables.push(umbrella);
    const shades = [0xf4f0e8, 0xff6fb4, 0x3fd8d0, 0xfff0b0].map((c) =>
      this.material({
        color: c,
        roughness: 0.8,
        side: DoubleSide,
        emissive: c,
        emissiveIntensity: 0.12,
      }),
    );
    const candle = this.material({ color: 0xffd080, emissive: 0xffb050, emissiveIntensity: 4 });
    const candleGlow = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(candleGlow);
    const corner = new CylinderGeometry(3.4, 3.4, 1, 28);
    const ring = new CylinderGeometry(3.48, 3.48, 0.14, 28, 1, true);
    const capGeometry = new CylinderGeometry(2.2, 3.4, 0.6, 28);
    this.disposables.push(corner, ring, capGeometry);
    const plant = this.material({ color: 0x8a8890, roughness: 0.8, metalness: 0.3 });
    const plantDish = this.material({ color: 0xd0d0d8, roughness: 0.5, side: DoubleSide });
    const timber = this.material({ color: 0x5a4a3a, roughness: 0.9 });
    const warning = this.material({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 4 });
    const drum = new CylinderGeometry(1.4, 1.4, 2.6, 14);
    const saucer = new SphereGeometry(0.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3);
    this.disposables.push(drum, saucer);
    const soft = this.track(auraTexture());
    const auras = NEON.map((c) => {
      const m = new MeshBasicMaterial({
        map: soft,
        color: c,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      this.disposables.push(m);
      return m;
    });
    const slab = this.material({ color: 0xf4f0ec, roughness: 0.7 });
    const rail = this.material({ color: 0xf8f8f8, roughness: 0.3, metalness: 0.4 });
    const signBox = this.material({ color: 0x14121c, roughness: 0.5, metalness: 0.6 });
    const iron = this.material({ color: 0x202024, roughness: 0.6, metalness: 0.8 });
    const vacancies = ['VACANCY', 'NO VACANCY'].map((text) =>
      this.material({
        map: this.track(neonWordTexture(text, '#ff3048')),
        emissive: 0xffffff,
        emissiveMap: this.track(neonWordTexture(text, '#ff3048')),
        emissiveIntensity: 2.4,
        transparent: true,
      }),
    );
    let offset = 0;
    let k = 0;
    while (offset < LOOP - 10) {
      const width = 22 + random() * 14;
      const blocked = CROSSINGS.find(
        (c) => offset < c + STREET / 2 && offset + width > c - STREET / 2,
      );
      if (blocked !== undefined) {
        offset = blocked + STREET / 2 + 1;
        continue;
      }
      const storeys = 3 + Math.floor(random() * 4);
      const height = storeys * 3.6 + 1.6;
      const depth = 18;
      const glow = NEON[k % NEON.length]!;
      const hotel = new Group();
      const facade = this.material({
        map: this.track(facadeTexture(storeys, 8101 + k * 13)),
        color: PASTELS[k % PASTELS.length],
        roughness: 0.8,
        emissive: 0xffffff,
        emissiveMap: this.track(windowsTexture(storeys, 8101 + k * 13)),
        emissiveIntensity: 0.9,
      });
      const body = new Mesh(this.unit, facade);
      body.scale.set(depth, height, width);
      body.position.set(depth / 2, height / 2, 0);
      body.castShadow = true;
      hotel.add(body);
      // The deco crown at the centre of the roofline: a stepped ziggurat of three tiers, or a
      // tower of fins rising to a finial, each tier's edge traced in neon.
      const line0 = neon[k % neon.length]!;
      const tiers = k % 2 === 0 ? 3 : 2;
      let top = height;
      for (let t = 0; t < tiers; t++) {
        const w = width * (0.42 - t * 0.11);
        const h = 2 + (k % 2 === 0 ? 1.2 : 3.6);
        const tier = new Mesh(this.unit, facade);
        tier.scale.set(4.5 - t * 0.8, h, w);
        tier.position.set(2.25 + t * 0.4, top + h / 2, 0);
        tier.castShadow = true;
        hotel.add(tier);
        top += h;
        const edge = new Mesh(tube, line0);
        edge.rotation.x = Math.PI / 2;
        edge.scale.set(1, w, 1);
        edge.position.set(0.02 + t * 0.8, top, 0);
        hotel.add(edge);
        if (k % 2 === 1)
          for (const z of [-w / 2 + 0.3, 0, w / 2 - 0.3]) {
            const fin = new Mesh(this.unit, facade);
            fin.scale.set(0.5, h, 0.35);
            fin.position.set(0.05 + t * 0.4, top - h / 2, z);
            hotel.add(fin);
          }
      }
      const mast = new Mesh(tube, line0);
      mast.scale.set(1.4, 4.5, 1.4);
      mast.position.set(2.5, top + 2.25, 0);
      const finial = new Mesh(this.unit, line0);
      finial.scale.set(0.5, 0.5, 0.5);
      finial.rotation.set(0.6, 0.6, 0);
      finial.position.set(2.5, top + 4.7, 0);
      hotel.add(mast, finial);
      // Neon along the roofline, the crown and every eyebrow ledge, facing the street.
      const line = neon[k % neon.length]!;
      const run = (y: number, length: number, x = -0.05) => {
        const t = new Mesh(tube, line);
        t.rotation.x = Math.PI / 2;
        t.scale.set(1, length, 1);
        t.position.set(x, y, 0);
        hotel.add(t);
      };
      run(height, width);
      for (let f = 1; f < storeys; f++) {
        if (random() < 0.5) run(1.6 + f * 3.6, width * (0.6 + random() * 0.3));
        const ledge = new Mesh(this.unit, facade);
        ledge.scale.set(0.9, 0.18, width * 0.92);
        ledge.position.set(-0.4, 1.6 + f * 3.6, 0);
        hotel.add(ledge);
      }
      // The two upright tubes framing the entrance.
      for (const z of [-width * 0.18, width * 0.18]) {
        const t = new Mesh(tube, line);
        t.scale.set(1, height - 1, 1);
        t.position.set(-0.05, (height - 1) / 2 + 0.5, z);
        hotel.add(t);
      }
      // The blade sign standing out over the sidewalk, the hotel's name down it.
      const sign = this.material({
        map: this.track(signTexture(NAMES[k % NAMES.length]!, glow)),
        emissive: 0xffffff,
        emissiveMap: this.track(signTexture(NAMES[k % NAMES.length]!, glow)),
        emissiveIntensity: 2.6,
        roughness: 0.5,
      });
      this.signs.push(sign);
      // The blade is a dark sheet-metal box, its name on both faces, edged with a neon tube,
      // held off the wall on three iron brackets and crowned with a sunburst of neon rays.
      const tall = Math.min(height + 2, 15);
      const bladeZ = width * 0.3;
      const blade = new Mesh(this.unit, signBox);
      blade.scale.set(3.2, tall, 0.5);
      blade.position.set(-1.9, tall / 2 + 2.4, bladeZ);
      hotel.add(blade);
      for (const side of [-1, 1]) {
        const face = new Mesh(this.flat, sign);
        face.scale.set(3.1, tall - 0.1, 1);
        face.rotation.y = side > 0 ? 0 : Math.PI;
        face.position.set(-1.9, tall / 2 + 2.4, bladeZ + side * 0.26);
        hotel.add(face);
      }
      for (const [y, l] of [
        [2.4, 3.2],
        [2.4 + tall, 3.2],
      ] as const) {
        const t = new Mesh(tube, line);
        t.rotation.z = Math.PI / 2;
        t.scale.set(1.3, l, 1.3);
        t.position.set(-1.9, y, bladeZ);
        hotel.add(t);
      }
      // The neon's glow in the humid air: a soft halo of the sign's colour round both faces,
      // and a band of it along the roofline tube.
      const aura = auras[k % auras.length]!;
      for (const side of [-1, 1]) {
        const halo = new Mesh(this.flat, aura);
        halo.scale.set(7.5, tall + 5, 1);
        halo.rotation.y = side > 0 ? 0 : Math.PI;
        halo.position.set(-1.9, tall / 2 + 2.4, bladeZ + side * 0.3);
        hotel.add(halo);
      }
      const roofGlow = new Mesh(this.flat, aura);
      roofGlow.rotation.y = -Math.PI / 2;
      roofGlow.scale.set(width * 1.05, 3.2, 1);
      roofGlow.position.set(-0.2, height, 0);
      hotel.add(roofGlow);
      for (const y of [3.4, 2.4 + tall / 2, 1.4 + tall]) {
        const arm = new Mesh(this.unit, iron);
        arm.scale.set(0.5, 0.12, 0.12);
        arm.position.set(-0.25, y, bladeZ);
        hotel.add(arm);
      }
      for (let r = 0; r < 7; r++) {
        const a = -Math.PI / 2 + (r / 6) * Math.PI;
        const ray = new Mesh(tube, line);
        ray.scale.set(1.2, 1.6, 1.2);
        ray.rotation.z = -a;
        ray.position.set(-1.9 + Math.sin(a) * 1.1, 2.6 + tall + Math.cos(a) * 1.1, bladeZ);
        hotel.add(ray);
      }
      // A striped awning over the café terrace, and its tables' lamps.
      const awning = this.material({
        map: this.track(awningTexture(glow)),
        roughness: 0.8,
        emissive: glow,
        emissiveIntensity: 0.15,
      });
      const a = new Mesh(this.unit, awning);
      a.scale.set(3.6, 0.15, width * 0.5);
      a.rotation.z = -0.25;
      a.position.set(-1.6, 3.4, -width * 0.1);
      hotel.add(a);
      // The ground floor: a lit lobby behind plate glass, and a marquee canopy over the door,
      // its fascia ringed with bulbs and its underside glowing.
      const lobby = new Mesh(this.flat, lobbies[k % lobbies.length]!);
      lobby.rotation.y = -Math.PI / 2;
      lobby.scale.set(width * 0.86, 3.3, 1);
      lobby.position.set(-0.03, 1.75, 0);
      hotel.add(lobby);
      const canopy = new Mesh(this.unit, facade);
      canopy.scale.set(3, 0.35, width * 0.32);
      canopy.position.set(-1.5, 3.7, 0);
      canopy.castShadow = true;
      const fascia = new Mesh(this.flat, bulbs);
      fascia.rotation.y = -Math.PI / 2;
      fascia.scale.set(width * 0.32, 0.35, 1);
      fascia.position.set(-3.02, 3.7, 0);
      const under = new Mesh(this.flat, line);
      under.rotation.x = Math.PI / 2;
      under.scale.set(2.8, width * 0.3, 1);
      under.rotation.z = Math.PI / 2;
      under.position.set(-1.5, 3.51, 0);
      hotel.add(canopy, fascia, under);
      // Every other hotel turns its far corner with a streamline drum: a round tower the
      // height of the façade, ringed at each floor by a band of the hotel's neon, rising
      // above the roof to a lit cap.
      if (k % 2 === 0) {
        const drum = new Mesh(corner, facade);
        drum.scale.set(1, height + 3, 1);
        drum.position.set(1.2, (height + 3) / 2, -width / 2 + 2.6);
        drum.castShadow = true;
        hotel.add(drum);
        for (let f = 1; f <= storeys + 1; f++) {
          const band = new Mesh(ring, line);
          band.position.set(1.2, Math.min(1.6 + f * 3.6, height + 3), -width / 2 + 2.6);
          hotel.add(band);
        }
        const cap = new Mesh(capGeometry, line);
        cap.position.set(1.2, height + 3, -width / 2 + 2.6);
        hotel.add(cap);
      }
      // Streamline balconies on two hotels in three: a slab on each upper floor in front of
      // alternate bays, rounded off by its pipe railing of three white rails.
      if (k % 3 !== 2) {
        const decks = new BoxBuilder();
        const bayW = width / 6.56;
        for (let f = 1; f < storeys; f++)
          for (let b = 0; b < 6; b++) {
            if ((b + f + k) % 2) continue;
            const z = -width / 2 + (b + 0.6) * (width / 6) + bayW * 0.2;
            const y = 1.6 + f * 3.6 - 1.2;
            if (Math.abs(z - width * 0.3) < 2.5) continue;
            decks.box(slab, [1.2, 0.16, bayW * 1.25], [-0.6, y, z]);
            for (const h of [0.35, 0.65, 0.95])
              decks.box(rail, [0.05, 0.05, bayW * 1.25], [-1.18, y + h, z]);
            for (const dz of [-0.5, 0.5]) {
              decks.box(rail, [1.2, 0.05, 0.05], [-0.6, y + 0.95, z + dz * bayW * 1.25]);
              decks.box(rail, [0.05, 0.95, 0.05], [-1.18, y + 0.5, z + dz * bayW * 1.25]);
            }
          }
        hotel.add(decks.build(this.disposables));
      }
      // The roof's clutter behind the crown: air-conditioning units, a water tank on its legs,
      // a stair-and-lift house, a dish or two and a radio mast with its red lamp.
      const roof = new BoxBuilder();
      const rnd = seeded(8261 + k);
      roof.box(plant, [5, 3, 4.5], [11 + rnd() * 3, height + 1.5, -width * 0.25]);
      for (let i = 0; i < 3 + Math.floor(rnd() * 4); i++)
        roof.box(
          plant,
          [1.6, 1.1, 1.2],
          [5 + rnd() * 11, height + 0.55, (rnd() - 0.5) * width * 0.8],
        );
      roof.box(plant, [0.2, 0.6, width], [0.1, height + 0.3, 0]);
      if (rnd() < 0.6) {
        const tx = 12 + rnd() * 3;
        const tz = width * 0.28;
        for (const [dx, dz] of [
          [-0.9, -0.9],
          [0.9, -0.9],
          [-0.9, 0.9],
          [0.9, 0.9],
        ] as const)
          roof.box(iron, [0.15, 2.4, 0.15], [tx + dx, height + 1.2, tz + dz]);
        const tank = new Mesh(drum, timber);
        tank.position.set(tx, height + 3.6, tz);
        tank.castShadow = true;
        hotel.add(tank);
      }
      const aerial = new Mesh(this.unit, iron);
      aerial.scale.set(0.12, 7, 0.12);
      aerial.position.set(14, height + 3.5, -width * 0.38);
      const lamp = new Mesh(this.unit, warning);
      lamp.scale.set(0.35, 0.35, 0.35);
      lamp.position.set(14, height + 7.1, -width * 0.38);
      this.beacons.push(lamp);
      const dish = new Mesh(saucer, plantDish);
      dish.rotation.set(0, 0, -1.1);
      dish.position.set(7, height + 1.1, width * 0.1);
      hotel.add(roof.build(this.disposables), aerial, lamp, dish);
      // The hotel's name again in flowing neon script across the façade over the marquee, and
      // a small VACANCY sign glowing in a ground-floor corner window.
      const script = this.material({
        map: this.track(scriptTexture(NAMES[k % NAMES.length]!, glow)),
        emissive: 0xffffff,
        emissiveMap: this.track(scriptTexture(NAMES[k % NAMES.length]!, glow)),
        emissiveIntensity: 2.2,
        transparent: true,
        depthWrite: false,
      });
      this.signs.push(script);
      const word = new Mesh(this.flat, script);
      word.rotation.y = -Math.PI / 2;
      word.scale.set(width * 0.55, width * 0.55 * 0.25, 1);
      word.position.set(-0.08, 5.9, 0);
      const vacancy = new Mesh(this.flat, vacancies[k % 2]!);
      vacancy.rotation.y = -Math.PI / 2;
      vacancy.scale.set(2.2, 0.55, 1);
      vacancy.position.set(-0.06, 2.6, -width * 0.36);
      hotel.add(word, vacancy);
      // The sidewalk café: tables under umbrellas between the marquee and the palms, a
      // candle glowing on each, the chairs drawn up round them.
      const cafe = new BoxBuilder();
      for (let z = -width * 0.4; z < width * 0.4; z += 3.2) {
        if (Math.abs(z) < width * 0.17) continue;
        const x = -4.2 - (Math.round(z) % 2) * 1.3;
        cafe.box(tableTop, [0.8, 0.05, 0.8], [x, 0.9, z]);
        cafe.box(metal, [0.06, 0.88, 0.06], [x, 0.45, z]);
        cafe.box(metal, [0.5, 0.04, 0.5], [x, 0.02, z]);
        for (const [dx, dz] of [
          [0.7, 0],
          [-0.7, 0],
          [0, 0.7],
          [0, -0.7],
        ] as const) {
          cafe.box(chair, [0.42, 0.05, 0.42], [x + dx, 0.48, z + dz]);
          const bx = x + dx * 1.3;
          const bz = z + dz * 1.3;
          cafe.box(chair, [dx ? 0.05 : 0.42, 0.5, dz ? 0.05 : 0.42], [bx, 0.75, bz]);
          cafe.box(metal, [0.04, 0.46, 0.04], [x + dx, 0.23, z + dz]);
        }
        cafe.box(metal, [0.05, 2.4, 0.05], [x, 1.2, z]);
        const shade = new Mesh(umbrella, shades[(k + Math.round(z)) % shades.length]!);
        shade.position.set(x, 2.45, z);
        shade.castShadow = true;
        const flame = new Mesh(this.unit, candle);
        flame.scale.set(0.08, 0.12, 0.08);
        flame.position.set(x, 0.98, z);
        const glow = new Mesh(this.flat, candleGlow);
        glow.scale.set(0.9, 0.9, 1);
        glow.position.set(x, 1.0, z);
        hotel.add(shade, flame, glow);
      }
      const tables = cafe.build(this.disposables);
      tables.position.y = 0.15;
      hotel.add(tables);
      // The sign and the hotel's neon mirrored in the wet street: long soft streaks of its
      // colour running towards the rider across the sidewalk and the near lane.
      const mirror = reflections[k % reflections.length]!;
      for (const [x, z, w, l] of [
        [-1.6, width * 0.3 + 5, 2.2, 10],
        [-FRONT - 1.4, width * 0.3 + 9, 2.6, 18],
        [-FRONT - 3.6, -width * 0.1 + 8, 1.6, 14],
      ] as const) {
        const streak = new Mesh(this.flat, mirror);
        streak.rotation.x = -Math.PI / 2;
        streak.scale.set(w, l, 1);
        streak.position.set(x, x > -FRONT ? 0.165 : 0.03, z);
        streak.renderOrder = 1;
        hotel.add(streak);
      }
      const holder = new Group();
      holder.add(hotel);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + width / 2, x: roadHalf + FRONT });
      offset += width + 3 + random() * 4;
      k++;
    }
  }

  /** Royal palms along both sidewalks, their trunks lit from below. */
  private addPalms(roadHalf: number): void {
    const random = seeded(8111);
    const palms = new Palms(this.disposables, this.track);
    const uplight = this.material({
      color: 0xfff0d0,
      emissive: 0xfff0d0,
      emissiveIntensity: 2,
      roughness: 0.5,
    });
    // Each trunk is washed with light from its uplight, warm white on most and pink, cyan or
    // violet on every third, fading as it climbs; a square iron grate rings the foot.
    const shell = new CylinderGeometry(0.29, 0.34, 7, 14, 1, true);
    shell.translate(0, 3.5, 0);
    this.disposables.push(shell);
    const wash = this.track(uplightTexture());
    const washes = [0xffe8c0, 0xff4fb8, 0x3fe0ff, 0xffe8c0, 0xb46bff].map((c) => {
      const m = new MeshBasicMaterial({
        map: wash,
        color: c,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      this.disposables.push(m);
      return m;
    });
    const grate = this.material({ color: 0x18181c, roughness: 0.7, metalness: 0.6 });
    let n = 0;
    for (let offset = 0; offset < LOOP; offset += 14 + random() * 4)
      for (const side of [-1, 1]) {
        const p = palms.make(random);
        p.scale.multiplyScalar(1.2);
        if (side > 0 && inCrossing(offset, 1.5)) continue;
        const lamp = new Mesh(this.unit, uplight);
        lamp.scale.set(0.3, 0.12, 0.3);
        lamp.position.set(0.5, 0.06, 0);
        const lit = new Mesh(shell, washes[n % 3 === 2 ? 1 + (((n / 3) % 3) | 0) : 0]!);
        const bed = new Mesh(this.unit, grate);
        bed.scale.set(1.5, 0.03, 1.5);
        bed.position.y = 0.01;
        const holder = new Group();
        holder.add(p, lamp, lit, bed);
        holder.position.y = 0.15;
        this.group.add(holder);
        const x = side > 0 ? roadHalf + 2 : -roadHalf - 2.6;
        this.props.push({ mesh: holder, offset: offset + (side > 0 ? 0 : 7), x });
        n++;
      }
  }

  /**
   * Deco lamp posts along the kerb and the promenade wall: a fluted white column, a ringed
   * collar and a frosted globe, a halo round it in the damp air and a warm pool on the ground.
   */
  private addLamps(roadHalf: number): void {
    const post = new CylinderGeometry(0.07, 0.11, 4.2, 10);
    post.translate(0, 2.1, 0);
    const collar = new CylinderGeometry(0.16, 0.12, 0.25, 12);
    collar.translate(0, 4.25, 0);
    const base = new CylinderGeometry(0.2, 0.24, 0.5, 10);
    base.translate(0, 0.25, 0);
    const globe = new SphereGeometry(0.28, 16, 12);
    globe.translate(0, 4.62, 0);
    this.disposables.push(post, collar, base, globe);
    const white = this.material({ color: 0xece8f0, roughness: 0.4, metalness: 0.3 });
    const lit = this.material({ color: 0xfff2d8, emissive: 0xffe8c0, emissiveIntensity: 3 });
    const halo = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const pool = new MeshBasicMaterial({
      map: this.track(poolTexture()),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(halo, pool);
    for (let offset = 6; offset < LOOP; offset += 24)
      for (const side of [-1, 1]) {
        if (side > 0 && inCrossing(offset + 12, 1)) continue;
        const lamp = new Group();
        lamp.add(new Mesh(post, white), new Mesh(collar, white), new Mesh(base, white));
        lamp.add(new Mesh(globe, lit));
        const h = new Mesh(this.flat, halo);
        h.scale.set(2.6, 2.6, 1);
        h.position.y = 4.62;
        const p = new Mesh(this.flat, pool);
        p.rotation.x = -Math.PI / 2;
        p.scale.set(7, 7, 1);
        p.position.y = 0.02;
        p.renderOrder = 1;
        lamp.add(h, p);
        lamp.children.slice(0, 3).forEach((m) => (m.castShadow = true));
        lamp.position.y = 0.15;
        const holder = new Group();
        holder.add(lamp);
        this.group.add(holder);
        const x = side > 0 ? roadHalf + 0.7 : -roadHalf - 4.5;
        this.props.push({ mesh: holder, offset: offset + (side > 0 ? 12 : 0), x });
      }
  }

  /**
   * Classic convertibles parked at the kerb, nose to tail: a long candy-painted body with a
   * lower bonnet and boot, flared fenders and tail fins, a cream bench seat in an open tub,
   * a raked chrome-framed windscreen, white-wall tyres on chrome hubs, glowing tail lights and
   * a pool of neon underglow on the wet road.
   */
  private addCars(roadHalf: number): void {
    const random = seeded(8121);
    const colours = [0xff3f8a, 0x2fc8e6, 0xf4f0e8, 0x1d1f24, 0xffd23f, 0x8a5aff];
    const paints = colours.map((c) => this.material({ color: c, roughness: 0.2, metalness: 0.55 }));
    const chrome = this.material({ color: 0xd8dce4, roughness: 0.12, metalness: 1 });
    const seat = this.material({ color: 0xf4e8d8, roughness: 0.7 });
    const tyre = this.material({ color: 0x18181c, roughness: 0.85 });
    const wall = this.material({ color: 0xf4f0ec, roughness: 0.6 });
    const glass = this.material({
      color: 0x8aa0c8,
      roughness: 0.05,
      metalness: 0.6,
      transparent: true,
      opacity: 0.45,
    });
    const tail = this.material({ color: 0xff2030, emissive: 0xff2030, emissiveIntensity: 3 });
    const head = this.material({ color: 0xfff4d8, emissive: 0xfff4d8, emissiveIntensity: 2 });
    const glows = [0xff3fb4, 0x2fe6ff, 0xb46bff].map(
      (c) =>
        new MeshBasicMaterial({
          map: this.track(poolTexture()),
          color: c,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
    );
    this.disposables.push(...glows);
    const wheel = new CylinderGeometry(0.36, 0.36, 0.24, 18);
    wheel.rotateZ(Math.PI / 2);
    const whitewall = new CylinderGeometry(0.25, 0.25, 0.25, 18);
    whitewall.rotateZ(Math.PI / 2);
    const hub = new CylinderGeometry(0.13, 0.13, 0.26, 12);
    hub.rotateZ(Math.PI / 2);
    this.disposables.push(wheel, whitewall, hub);
    const beam = new MeshBasicMaterial({
      map: this.track(beamTexture()),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const flare = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(beam, flare);
    const make = (k: number, parked: boolean): Group => {
      const paint = paints[k % paints.length]!;
      const b = new BoxBuilder();
      // The body: a waist-high hull, the bonnet and boot dropping lower, fenders and fins.
      b.box(paint, [1.9, 0.5, 5], [0, 0.62, 0]);
      b.box(paint, [1.84, 0.18, 1.7], [0, 0.94, -1.55]);
      b.box(paint, [1.84, 0.18, 1.3], [0, 0.94, 1.75]);
      b.box(paint, [1.86, 0.22, 1.5], [0, 0.95, 0.2]);
      for (const x of [-0.82, 0.82]) {
        b.box(paint, [0.24, 0.3, 0.9], [x, 1.1, 2.15], x > 0 ? -0.25 : 0.25);
        b.box(chrome, [0.04, 0.05, 4.6], [x * 1.17, 0.78, 0]);
      }
      b.box(seat, [1.6, 0.12, 1.5], [0, 0.98, 0.35]);
      b.box(seat, [1.6, 0.5, 0.18], [0, 1.2, 0.95]);
      b.box(seat, [1.6, 0.4, 0.14], [0, 1.15, -0.3]);
      b.box(chrome, [1.95, 0.14, 0.2], [0, 0.42, -2.55]);
      b.box(chrome, [1.95, 0.14, 0.2], [0, 0.42, 2.55]);
      b.box(chrome, [1.6, 0.06, 0.06], [0, 1.52, -0.7]);
      b.box(glass, [1.56, 0.5, 0.03], [0, 1.27, -0.72]);
      const car = b.build(this.disposables);
      for (const x of [-0.62, 0.62]) {
        const t = new Mesh(this.unit, tail);
        t.scale.set(0.28, 0.12, 0.05);
        t.position.set(x, 0.8, 2.52);
        const h = new Mesh(this.unit, head);
        h.scale.set(0.3, 0.16, 0.05);
        h.position.set(x, 0.74, -2.52);
        car.add(t, h);
        for (const z of [-1.6, 1.55]) {
          const w = new Mesh(wheel, tyre);
          const ww = new Mesh(whitewall, wall);
          const hc = new Mesh(hub, chrome);
          for (const m of [w, ww, hc]) {
            m.position.set(x * 1.38, 0.36, z);
            car.add(m);
          }
        }
      }
      const glow = new Mesh(this.flat, glows[k % glows.length]!);
      glow.rotation.x = -Math.PI / 2;
      glow.scale.set(3.4, 6.4, 1);
      glow.position.y = 0.03;
      glow.renderOrder = 1;
      car.add(glow);
      if (!parked) {
        // Headlights on: a flare at each lamp and their beams thrown ahead on the wet road.
        for (const x of [-0.62, 0.62]) {
          const f = new Mesh(this.flat, flare);
          f.scale.set(1.4, 1.4, 1);
          f.rotation.y = Math.PI;
          f.position.set(x, 0.74, -2.6);
          car.add(f);
        }
        const b = new Mesh(this.flat, beam);
        b.rotation.x = -Math.PI / 2;
        b.scale.set(3.6, 16, 1);
        b.position.set(0, 0.04, -10.5);
        b.renderOrder = 1;
        car.add(b);
      }
      return car;
    };
    for (let k = 0; k < 8; k++) {
      const car = make(k, true);
      car.rotation.y = (random() - 0.5) * 0.05;
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      let at = 40 + k * 46 + random() * 8;
      if (inCrossing(at, 4)) at += STREET + 8;
      this.props.push({ mesh: holder, offset: at, x: roadHalf - 1.1 });
    }
    // Cruising traffic in the far lane, headlights on, rolling towards the rider.
    for (let k = 0; k < 5; k++) {
      const car = make(k + 3, false);
      car.rotation.y = Math.PI;
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      this.traffic.push({
        mesh: holder,
        offset: 45 + k * 75 + random() * 20,
        speed: 8 + random() * 3,
      });
    }
    this.trafficX = -roadHalf * 0.5;
  }

  /**
   * South Beach's painted lifeguard towers on the sand, closed for the night, their ramps
   * towards the promenade, each with a neon band round its deck and a lamp-lit hut.
   */
  private addLifeguards(roadHalf: number): void {
    const towers = new LifeguardTowers(this.disposables, this.track);
    const bands = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.4, roughness: 0.4 }),
    );
    for (let i = 0; i < 5; i++) {
      const tower = towers.make(i + 1);
      tower.rotation.y = Math.PI + (i % 2 ? 0.2 : -0.15);
      for (const [w, d, x, z] of [
        [3.3, 0.08, 0, 1.62],
        [3.3, 0.08, 0, -1.62],
        [0.08, 3.3, 1.62, 0],
        [0.08, 3.3, -1.62, 0],
      ] as const) {
        const band = new Mesh(this.unit, bands[(i * 2) % bands.length]!);
        band.scale.set(w, 0.08, d);
        band.position.set(x, 1.82, z);
        tower.add(band);
      }
      const glow = new Mesh(this.flat, this.halo);
      glow.scale.set(5, 5, 1);
      glow.position.set(0, 2.9, 1.4);
      tower.add(glow);
      const holder = new Group();
      const across = 12 + (i % 2) * 5;
      holder.add(tower);
      holder.position.y = -0.3 - ((across - 5.5) / (BEACH - 5.5)) * (SEA - 0.2);
      tower.position.y = 0;
      const outer = new Group();
      outer.add(holder);
      this.group.add(outer);
      this.props.push({ mesh: outer, offset: 20 + i * 80, x: -roadHalf - across });
    }
  }

  /**
   * The side streets: asphalt running off between the hotels, a zebra crossing over the
   * boulevard, a signal on a mast arm reaching over the road with its lights cycling, and a
   * green street-name sign.
   */
  private addCrossings(roadHalf: number): void {
    const r = roadHalf;
    const asphalt = this.material({
      map: this.repeat(roadTexture(), r * 2, 16),
      roughness: 0.25,
      metalness: 0.2,
    });
    const zebra = this.material({ color: 0xece8e0, roughness: 0.5 });
    const steel = this.material({ color: 0x3a3c44, roughness: 0.5, metalness: 0.7 });
    const housing = this.material({ color: 0x1a1a14, roughness: 0.6 });
    const nameplate = this.material({
      map: this.track(streetSignTexture()),
      roughness: 0.5,
      emissive: 0xffffff,
      emissiveMap: this.track(streetSignTexture()),
      emissiveIntensity: 0.25,
    });
    const lamps = [0xff2a2a, 0xffb020, 0x30ff80].map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 0 }),
    );
    this.lights.push(...lamps);
    CROSSINGS.forEach((c) => {
      const crossing = new Group();
      const side = new Mesh(this.unit, asphalt);
      side.scale.set(FRONT + 40, 0.1, STREET);
      side.position.set(r + (FRONT + 40) / 2, 0.02, 0);
      side.receiveShadow = true;
      crossing.add(side);
      for (let x = -r + 0.4; x < r; x += 1.1) {
        const bar = new Mesh(this.unit, zebra);
        bar.scale.set(0.55, 0.02, 3.2);
        bar.position.set(x, 0.025, STREET / 2 - 2);
        crossing.add(bar);
      }
      // The signal: a pole on the near corner, its mast arm out over the boulevard.
      const pole = new Mesh(this.unit, steel);
      pole.scale.set(0.22, 6.4, 0.22);
      pole.position.set(r + 0.8, 3.35, STREET / 2 + 0.6);
      const arm = new Mesh(this.unit, steel);
      arm.scale.set(r + 1.2, 0.14, 0.14);
      arm.position.set(r * 0.5 + 0.2, 6.2, STREET / 2 + 0.6);
      crossing.add(pole, arm);
      for (const x of [r * 0.5, -r * 0.1]) {
        const head = new Mesh(this.unit, housing);
        head.scale.set(0.42, 1.25, 0.32);
        head.position.set(x, 5.45, STREET / 2 + 0.6);
        crossing.add(head);
        lamps.forEach((m, i) => {
          const bulb = new Mesh(this.flat, m);
          bulb.scale.set(0.26, 0.26, 1);
          bulb.position.set(x, 5.85 - i * 0.4, STREET / 2 + 0.77);
          crossing.add(bulb);
        });
      }
      const name = new Mesh(this.unit, nameplate);
      name.scale.set(0.05, 0.3, 1.6);
      name.position.set(r + 0.8, 4.2, STREET / 2 + 0.6 - 0.9);
      crossing.add(name);
      const holder = new Group();
      holder.add(crossing);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: c, x: 0 });
    });
  }

  /** People out for the night on both sidewalks. */
  private addPeople(roadHalf: number): void {
    const random = seeded(8131);
    // Strollers keep to the clear lanes: the kerb side and the shopfronts on the right, between
    // the palms and the café tables, and the promenade on the left.
    for (let k = 0; k < 44; k++) {
      const lane = k % 3;
      const x =
        lane === 0
          ? -roadHalf - 1 - random() * 2.6
          : lane === 1
            ? roadHalf + 1.1 + random() * 1.2
            : roadHalf + FRONT - 1.6 + random() * 1.1;
      this.people.push({
        offset: random() * LOOP,
        x,
        speed: (random() < 0.5 ? -1 : 1) * (0.7 + random() * 0.6),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, NIGHT_WEAR, 8137);
    // Knots of two to four people standing and talking: outside the lobbies and against the
    // promenade wall looking out to sea, each swaying a little as they chat.
    const chat = seeded(8139);
    for (let g = 0; g < 18; g++) {
      const wall = g % 3 === 0;
      const offset = chat() * LOOP;
      const cx = wall ? -roadHalf - 4.3 : roadHalf + FRONT - 2.2 - chat() * 1.5;
      const size = 2 + Math.floor(chat() * 3);
      for (let i = 0; i < size; i++) {
        const angle = (i / size) * Math.PI * 2 + chat();
        const x = wall ? cx + 0.2 : cx + Math.cos(angle) * 0.55;
        const z = wall ? i * 0.65 : Math.sin(angle) * 0.55;
        this.standers.push({
          offset: offset + z,
          x,
          heading: wall ? Math.PI / 2 : Math.atan2(cx - x, -z) + Math.PI,
          phase: chat() * 6,
          scale: 0.92 + chat() * 0.14,
        });
      }
    }
    this.chatting = new Figures(
      this.group,
      this.disposables,
      this.standers.length,
      NIGHT_WEAR,
      8143,
    );
  }

  /**
   * The tail of the shower: a light drizzle of streaks falling round the rider, slanting a
   * little in the sea breeze and catching the neon, held still for reduced motion.
   */
  private addDrizzle(): void {
    const random = seeded(8281);
    const streak = new PlaneGeometry(0.018, 0.55);
    const material = new MeshBasicMaterial({
      color: 0xc8d8ff,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const count = 700;
    const rain = new InstancedMesh(streak, material, count);
    rain.frustumCulled = false;
    this.disposables.push(streak, material, rain);
    for (let i = 0; i < count; i++)
      this.drops.push({
        x: (random() - 0.5) * 34,
        y: random() * 14,
        z: 6 - random() * 50,
        speed: 7 + random() * 3,
      });
    this.rain = rain;
    this.horizon.add(rain);
  }

  /** Across the bay, the towers lit floor by floor, the moon path and the night sea. */
  private addBay(): void {
    const random = seeded(8141);
    const towers = [0, 1, 2].map((v) =>
      this.material({
        map: this.track(towerTexture(8141 + v)),
        emissive: 0xffffff,
        emissiveMap: this.track(towerTexture(8141 + v)),
        emissiveIntensity: 1.2,
        roughness: 0.4,
        metalness: 0.4,
        fog: false,
      }),
    );
    const crowns = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 3, fog: false }),
    );
    const beacon = this.material({
      color: 0xff2020,
      emissive: 0xff2020,
      emissiveIntensity: 4,
      fog: false,
    });
    const edge = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.4, fog: false }),
    );
    // Two ranks of towers: the nearer, taller ones with setbacks, crowns and spires, and a
    // lower rank behind them filling the gaps.
    for (let rank = 0; rank < 2; rank++)
      for (let k = 0; k < (rank ? 30 : 24); k++) {
        const h = rank ? 40 + random() * 90 : 70 + random() * 190;
        const w = 26 + random() * 30;
        const d = 26 + random() * 20;
        const x = -1000 + k * (rank ? 64 : 82) + random() * 30;
        const z = rank ? -1950 - random() * 200 : -1500 - random() * 300;
        const shaft = towers[(k + rank) % towers.length]!;
        let top = -SEA;
        let width = w;
        let depth = d;
        const tiers = rank ? 1 : 1 + Math.floor(random() * 3);
        for (let t = 0; t < tiers; t++) {
          const th = (t === 0 ? 0.7 : 0.18) * h;
          const m = new Mesh(this.unit, shaft);
          m.scale.set(width, th, depth);
          m.position.set(x, top + th / 2, z);
          this.horizon.add(m);
          top += th;
          if (!rank && random() < 0.6) {
            // Lit edges up the tower's corners.
            for (const side of [-1, 1]) {
              const e = new Mesh(this.unit, edge[(k + t) % edge.length]!);
              e.scale.set(1.2, th, 1.2);
              e.position.set(x + (side * width) / 2, top - th / 2, z + depth / 2);
              this.horizon.add(e);
            }
          }
          width *= 0.72;
          depth *= 0.72;
        }
        if (!rank && random() < 0.55) {
          const c = new Mesh(this.unit, crowns[k % crowns.length]!);
          c.scale.set(width * 1.4, 3, depth * 1.4);
          c.position.set(x, top + 1.5, z);
          this.horizon.add(c);
        }
        if (!rank && random() < 0.5) {
          const spire = 18 + random() * 40;
          const m = new Mesh(this.unit, shaft);
          m.scale.set(2, spire, 2);
          m.position.set(x, top + spire / 2, z);
          const b = new Mesh(this.unit, beacon);
          b.scale.set(3.5, 3.5, 3.5);
          b.position.set(x, top + spire + 1, z);
          this.horizon.add(m, b);
          this.beacons.push(b);
        }
      }
    // The open sea to the horizon on the left, the moon's path laid across it.
    const water = this.material({
      color: 0x1a2048,
      roughness: 0.05,
      metalness: 0.5,
      emissive: 0x0a1030,
      emissiveIntensity: 0.6,
    });
    const sea = new Mesh(new PlaneGeometry(5000, 4000), water);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-2500, -SEA - 0.1, -1000);
    this.disposables.push(sea.geometry);
    this.horizon.add(sea);
    // The moon's path: a road of glitter laid on the sea from near the shore out to the
    // horizon under the moon, narrow near and fading at its edges, its sparkles drifting.
    const glitter = this.track(glitterTexture());
    glitter.wrapS = RepeatWrapping;
    glitter.wrapT = RepeatWrapping;
    glitter.repeat.set(1, 1.5);
    this.glitter = glitter;
    const path = new PlaneGeometry(70, 1850);
    path.rotateX(-Math.PI / 2);
    this.disposables.push(path);
    const shimmer = new MeshBasicMaterial({
      map: glitter,
      color: 0xd8e0ff,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    this.disposables.push(shimmer);
    const moonward = Math.atan2(900, 1900);
    const road = new Mesh(path, shimmer);
    road.rotation.y = moonward;
    road.position.set(-Math.sin(moonward) * 980, -SEA + 0.05, -Math.cos(moonward) * 980);
    this.horizon.add(road);
    // The city's violet glow rising behind the towers, and the moon over the sea.
    const glow = new MeshBasicMaterial({
      map: this.track(glowTexture()),
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    const band = new Mesh(new PlaneGeometry(4200, 700), glow);
    band.position.set(0, 300, -1950);
    // The full moon, its seas and craters, wrapped in a pale halo in the humid air.
    const moon = new Mesh(
      new SphereGeometry(28, 32, 20),
      new MeshBasicMaterial({ map: this.track(moonTexture()), fog: false }),
    );
    moon.rotation.y = -Math.PI / 2;
    moon.position.set(-900, 520, -1900);
    const halo = new Mesh(
      new PlaneGeometry(420, 420),
      new MeshBasicMaterial({
        map: this.track(moonHaloTexture()),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    halo.position.set(-900, 520, -1930);
    this.disposables.push(glow, band.geometry, moon.geometry, moon.material);
    this.disposables.push(halo.geometry, halo.material);
    // A sprinkling of stars above the glow, the brighter ones twinkling blue-white, and wisps
    // of cloud lit from below by the city.
    const stars = new Mesh(
      new PlaneGeometry(6400, 1600),
      new MeshBasicMaterial({
        map: this.track(starsTexture()),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    stars.position.set(0, 1100, -2100);
    const clouds = new Mesh(
      new PlaneGeometry(5200, 500),
      new MeshBasicMaterial({
        map: this.track(cloudTexture()),
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    clouds.position.set(400, 620, -2000);
    this.disposables.push(stars.geometry, stars.material, clouds.geometry, clouds.material);
    this.horizon.add(stars, band, clouds, halo, moon);
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

/**
 * The wet black asphalt across the whole road, 16 m of it: aggregate and tar seams, darker
 * glossy puddles smeared with neon, a solid white edge line inside each gutter, the double
 * yellow centre line and, once in the tile, a cast-iron manhole cover.
 */
function roadTexture(): CanvasTexture {
  return canvasTexture(512, 1024, (g) => {
    speckle(g, 512, 1024, '#26262c', 8151);
    const random = seeded(8153);
    // Aggregate: pale stones catching the light.
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(200,200,220,${(0.05 + random() * 0.12).toFixed(2)})`;
      g.fillRect(random() * 512, random() * 1024, 1.5, 1.5);
    }
    // Puddles: darker, smoother patches.
    for (let i = 0; i < 9; i++) {
      const x = random() * 512;
      const y = random() * 1024;
      const r = 20 + random() * 50;
      const puddle = g.createRadialGradient(x, y, 0, x, y, r);
      puddle.addColorStop(0, 'rgba(8,8,16,0.6)');
      puddle.addColorStop(1, 'rgba(8,8,16,0)');
      g.fillStyle = puddle;
      g.fillRect(x - r, y - r * 2, r * 2, r * 4);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = ['rgba(255,63,180,0.14)', 'rgba(47,230,255,0.12)', 'rgba(180,107,255,0.12)'][
        i % 3
      ]!;
      g.fillRect(random() * 512, random() * 1024, 2 + random() * 8, 30 + random() * 80);
    }
    // Tar seams and a crack or two.
    g.strokeStyle = 'rgba(10,10,14,0.8)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 300);
    g.lineTo(512, 310);
    for (let i = 0; i < 4; i++) {
      let x = random() * 512;
      let y = random() * 1024;
      g.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += (random() - 0.5) * 30;
        y += random() * 30;
        g.lineTo(x, y);
      }
    }
    g.stroke();
    // Edge lines and the double yellow centre line, slightly worn.
    g.fillStyle = 'rgba(236,232,220,0.85)';
    g.fillRect(14, 0, 8, 1024);
    g.fillRect(490, 0, 8, 1024);
    g.fillStyle = 'rgba(240,196,40,0.9)';
    g.fillRect(244, 0, 8, 1024);
    g.fillRect(260, 0, 8, 1024);
    g.fillStyle = 'rgba(38,38,44,0.5)';
    for (let i = 0; i < 60; i++) g.fillRect(240 + random() * 30, random() * 1024, 4, 3);
    // A manhole cover in the right lane.
    g.fillStyle = '#1a1a1e';
    g.beginPath();
    g.arc(380, 700, 26, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(120,120,140,0.6)';
    g.lineWidth = 2;
    for (let r = 8; r < 26; r += 6) {
      g.beginPath();
      g.arc(380, 700, r, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

/**
 * Ocean Drive's sidewalk: hexagonal pavers in rose and grey, each its own shade, with dark
 * sand joints and a wet sheen, 2.4 m to the tile.
 */
function pavingTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#3a3440';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(8161);
    const r = 16;
    const w = Math.sqrt(3) * r;
    for (let row = -1; row < 256 / (r * 1.5) + 1; row++)
      for (let col = -1; col < 256 / w + 1; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0);
        const cy = row * r * 1.5;
        const rose = random() < 0.35;
        const v = 140 + Math.floor(random() * 30);
        g.fillStyle = rose ? `rgb(${v + 20},${v - 20},${v - 10})` : `rgb(${v},${v - 4},${v + 6})`;
        g.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (i * Math.PI) / 3;
          const x = cx + Math.cos(a) * (r - 1.5);
          const y = cy + Math.sin(a) * (r - 1.5);
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.closePath();
        g.fill();
      }
    // A wet sheen in patches.
    for (let i = 0; i < 6; i++) {
      const x = random() * 256;
      const y = random() * 256;
      const sheen = g.createRadialGradient(x, y, 0, x, y, 50);
      sheen.addColorStop(0, 'rgba(20,16,30,0.35)');
      sheen.addColorStop(1, 'rgba(20,16,30,0)');
      g.fillStyle = sheen;
      g.fillRect(x - 50, y - 50, 100, 100);
    }
  });
}

/** The promenade: deco waves of pale and dusk-pink stone running along the sea wall. */
function promenadeTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#a8a0b0', 8163);
    g.lineWidth = 18;
    for (let band = 0; band < 6; band++) {
      g.strokeStyle = band % 2 ? 'rgba(200,140,160,0.55)' : 'rgba(240,236,244,0.35)';
      g.beginPath();
      for (let y = 0; y <= 256; y += 4) {
        const x = band * 51 + 20 + Math.sin((y / 256) * Math.PI * 4) * 16;
        if (y) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    }
  });
}

/** The beach at night, pale sand gone grey-blue. */
function sandTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#8a8a9a', 8171));
}

/** The night sea, ripples catching the light. */
function seaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#2a3060', 8181);
    const random = seeded(8183);
    g.fillStyle = 'rgba(200,210,255,0.3)';
    for (let i = 0; i < 40; i++) g.fillRect(random() * 128, random() * 128, 10, 1);
  });
}

/** Where a façade's windows fall: per storey, paired windows between deco pilasters. */
function windowBays(storeys: number): { x: number; y: number; w: number; h: number }[] {
  const bays: { x: number; y: number; w: number; h: number }[] = [];
  const band = 512 / storeys;
  for (let f = 0; f < storeys; f++)
    for (let x = 22; x < 490; x += 78)
      for (const dx of [0, 30])
        bays.push({ x: x + dx, y: f * band + band * 0.3, w: 26, h: band * 0.48 });
  return bays;
}

/**
 * A hotel's stucco front: storey bands, fluted pilasters between the bays, a shadowed eyebrow
 * over each pair of windows, racing stripes at the corners and the window openings with
 * their mullions.
 */
function facadeTexture(storeys: number, seed: number): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#f4f0ec', seed);
    const band = 512 / storeys;
    // Fluted pilasters: pale ribs with a shadow line, rising the full height between bays.
    for (let x = 8; x < 512; x += 78) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x, 0, 10, 512);
      g.fillStyle = 'rgba(70,60,80,0.28)';
      g.fillRect(x + 10, 0, 3, 512);
      g.fillRect(x + 4, 0, 1, 512);
    }
    for (let f = 0; f < storeys; f++) {
      const top = f * band;
      // The string course between storeys, lit from above.
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.fillRect(0, top, 512, 3);
      g.fillStyle = 'rgba(70,60,90,0.35)';
      g.fillRect(0, top + 3, 512, 4);
      // Three racing stripes at each corner, the deco speed lines.
      g.fillStyle = 'rgba(60,50,80,0.3)';
      for (let i = 0; i < 3; i++) {
        g.fillRect(0, top + band * 0.18 + i * 6, 14, 2);
        g.fillRect(498, top + band * 0.18 + i * 6, 14, 2);
      }
    }
    for (const b of windowBays(storeys)) {
      g.fillStyle = '#20202e';
      g.fillRect(b.x, b.y, b.w, b.h);
      // The mullion and transom, and a pale reveal down one side.
      g.fillStyle = 'rgba(230,230,240,0.85)';
      g.fillRect(b.x + b.w / 2 - 1, b.y, 2, b.h);
      g.fillRect(b.x, b.y + b.h * 0.3, b.w, 2);
      g.fillStyle = 'rgba(255,255,255,0.4)';
      g.fillRect(b.x - 2, b.y, 2, b.h);
      // The eyebrow's shadow falling across the window head.
      g.fillStyle = 'rgba(30,25,45,0.45)';
      g.fillRect(b.x - 3, b.y - 2, b.w + 6, 6);
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(b.x - 4, b.y - 5, b.w + 8, 3);
    }
  });
}

/** The same windows, lit warm, pink or blue, or dark behind drawn blinds. */
function windowsTexture(storeys: number, seed: number): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(seed + 1);
    for (const b of windowBays(storeys)) {
      if (random() < 0.4) continue;
      const lit = ['#ffd8a0', '#ffe8c8', '#ff9ec9', '#a8e8ff', '#ffc890'][
        Math.floor(random() * 5)
      ]!;
      g.fillStyle = lit;
      g.fillRect(b.x, b.y, b.w, b.h);
      // Some have their blinds half down, slatted.
      if (random() < 0.4) {
        g.fillStyle = 'rgba(0,0,0,0.55)';
        const down = b.h * (0.3 + random() * 0.4);
        for (let y = 0; y < down; y += 3) g.fillRect(b.x, b.y + y, b.w, 2);
      }
      g.fillStyle = '#000';
      g.fillRect(b.x + b.w / 2 - 1, b.y, 2, b.h);
      g.fillRect(b.x, b.y + b.h * 0.3, b.w, 2);
    }
  });
}

/** A blade sign's face: the hotel's name in glowing neon capitals inside a border of bulbs. */
function signTexture(name: string, glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  return canvasTexture(128, 1024, (g) => {
    g.fillStyle = '#100c18';
    g.fillRect(0, 0, 128, 1024);
    for (let y = 10; y < 1024; y += 20)
      for (const x of [10, 118]) {
        g.fillStyle = (y / 20) % 2 < 1 ? '#fff4d0' : '#ffc860';
        g.beginPath();
        g.arc(x, y, 4, 0, Math.PI * 2);
        g.fill();
      }
    g.strokeStyle = colour;
    g.lineWidth = 3;
    g.strokeRect(22, 22, 84, 980);
    g.font = 'bold 92px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const letters = name.replace(/ /g, '').split('');
    const step = 940 / letters.length;
    letters.forEach((c, i) => {
      const y = 46 + step * (i + 0.5);
      g.shadowColor = colour;
      g.shadowBlur = 16;
      g.fillStyle = colour;
      g.fillText(c, 64, y);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.font = 'bold 86px sans-serif';
      g.fillText(c, 64, y);
      g.font = 'bold 92px sans-serif';
    });
  });
}

/** An awning striped white and the hotel's neon colour. */
function awningTexture(glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  return canvasTexture(64, 64, (g) => {
    for (let x = 0; x < 64; x += 16) {
      g.fillStyle = colour;
      g.fillRect(x, 0, 8, 64);
      g.fillStyle = '#f4f0e8';
      g.fillRect(x + 8, 0, 8, 64);
    }
  });
}

/** A far tower's glass, its floors lit in rows. */
function towerTexture(seed: number): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.fillStyle = '#0a0c18';
    g.fillRect(0, 0, 64, 256);
    const random = seeded(seed);
    for (let y = 2; y < 256; y += 6)
      for (let x = 2; x < 64; x += 6) {
        if (random() < 0.5) continue;
        g.fillStyle = random() < 0.8 ? '#ffe0a8' : '#a8e8ff';
        g.fillRect(x, y, 3, 3);
      }
  });
}

/** The city glow: violet and magenta fading up from the horizon into the night. */
function glowTexture(): CanvasTexture {
  return canvasTexture(16, 256, (g) => {
    const glow = g.createLinearGradient(0, 256, 0, 0);
    glow.addColorStop(0, 'rgba(255,80,180,0.75)');
    glow.addColorStop(0.3, 'rgba(150,70,220,0.45)');
    glow.addColorStop(1, 'rgba(40,20,90,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 16, 256);
  });
}

/** The moon's face: pale grey-white with its darker seas and a scatter of bright craters. */
function moonTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = '#f2f0f8';
    g.fillRect(0, 0, 256, 128);
    const random = seeded(8191);
    const seas: [number, number, number][] = [
      [150, 40, 18],
      [170, 62, 14],
      [132, 70, 20],
      [112, 46, 12],
      [160, 88, 10],
      [190, 48, 9],
    ];
    for (const [x, y, r] of seas) {
      const sea = g.createRadialGradient(x, y, 0, x, y, r);
      sea.addColorStop(0, 'rgba(120,120,140,0.6)');
      sea.addColorStop(1, 'rgba(120,120,140,0)');
      g.fillStyle = sea;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 60; i++) {
      const x = random() * 256;
      const y = random() * 128;
      g.fillStyle = 'rgba(140,140,160,0.35)';
      g.beginPath();
      g.arc(x, y, 1 + random() * 2.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(x - 0.5, y - 1.5, 1, 1);
    }
  });
}

/** A soft cool halo round the moon, brightest at its rim and fading out into the night. */
function moonHaloTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const halo = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    halo.addColorStop(0, 'rgba(220,228,255,0.9)');
    halo.addColorStop(0.14, 'rgba(200,210,255,0.55)');
    halo.addColorStop(0.35, 'rgba(160,160,240,0.18)');
    halo.addColorStop(1, 'rgba(120,100,220,0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, 128, 128);
  });
}

/** The stars of a hazy city night: few, faint, a handful bright enough to show a cross. */
function starsTexture(): CanvasTexture {
  return canvasTexture(2048, 512, (g) => {
    const random = seeded(8201);
    for (let i = 0; i < 900; i++) {
      const x = random() * 2048;
      const y = random() * 512;
      const fade = 0.25 + (1 - y / 512) * 0.6;
      const bright = random();
      g.fillStyle = `rgba(${bright < 0.2 ? '200,220,255' : '255,250,240'},${(fade * (0.3 + bright * 0.7)).toFixed(2)})`;
      const r = bright > 0.97 ? 2 : 1;
      g.fillRect(x, y, r, r);
      if (bright > 0.985) {
        g.fillRect(x - 3, y + 0.5, 7, 1);
        g.fillRect(x + 0.5, y - 3, 1, 7);
      }
    }
  });
}

/** Thin bands of cloud, violet underneath where the city lights them, dark above. */
function cloudTexture(): CanvasTexture {
  return canvasTexture(1024, 128, (g) => {
    const random = seeded(8211);
    for (let i = 0; i < 70; i++) {
      const x = random() * 1024;
      const y = 30 + random() * 70;
      const w = 40 + random() * 160;
      const h = 6 + random() * 14;
      const puff = g.createRadialGradient(x, y, 0, x, y, w / 2);
      puff.addColorStop(0, 'rgba(190,100,180,0.5)');
      puff.addColorStop(0.6, 'rgba(100,55,140,0.28)');
      puff.addColorStop(1, 'rgba(40,20,80,0)');
      g.fillStyle = puff;
      g.save();
      g.translate(x, y);
      g.scale(1, h / w);
      g.translate(-x, -y);
      g.fillRect(x - w / 2, y - w / 2, w, w);
      g.restore();
    }
  });
}

/** A light's reflection in a wet street: broken vertical streaks, brightest near the light. */
function reflectionTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const random = seeded(8221);
    for (let i = 0; i < 40; i++) {
      const x = 8 + random() * 48;
      const w = 1 + random() * 4;
      const fall = g.createLinearGradient(0, 0, 0, 256);
      const a = 0.2 + random() * 0.5;
      fall.addColorStop(0, `rgba(255,255,255,${a})`);
      fall.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`);
      fall.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fall;
      const y = random() * 40;
      g.fillRect(x, y, w, 256 - y - random() * 80);
    }
    // Fade the sides so a streak has no hard edge.
    const sides = g.createLinearGradient(0, 0, 64, 0);
    sides.addColorStop(0, 'rgba(0,0,0,1)');
    sides.addColorStop(0.25, 'rgba(0,0,0,0)');
    sides.addColorStop(0.75, 'rgba(0,0,0,0)');
    sides.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = sides;
    g.fillRect(0, 0, 64, 256);
  });
}

/** The warm pool a lamp throws on the wet ground. */
function poolTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const pool = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    pool.addColorStop(0, 'rgba(255,220,170,0.7)');
    pool.addColorStop(0.5, 'rgba(255,200,140,0.22)');
    pool.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = pool;
    g.fillRect(0, 0, 64, 64);
  });
}

/**
 * A hotel lobby through its plate glass: warm light on a terrazzo floor, a reception desk,
 * potted palms, a chandelier's glow and the glazing bars of the shopfront.
 */
function lobbyTexture(seed: number): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    const random = seeded(seed);
    const wall = g.createLinearGradient(0, 0, 0, 128);
    wall.addColorStop(0, ['#ffd9a8', '#ffc8d8', '#c8f0ff', '#ffe8b8'][seed % 4]!);
    wall.addColorStop(0.7, '#e0a878');
    wall.addColorStop(1, '#6a4a48');
    g.fillStyle = wall;
    g.fillRect(0, 0, 512, 128);
    // Chandeliers' glow along the ceiling.
    for (let x = 60; x < 512; x += 130) {
      const lamp = g.createRadialGradient(x, 10, 0, x, 10, 40);
      lamp.addColorStop(0, 'rgba(255,255,240,0.95)');
      lamp.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = lamp;
      g.fillRect(x - 40, 0, 80, 50);
    }
    // The reception desk and some guests or potted palms.
    g.fillStyle = '#3a2a2a';
    g.fillRect(200, 78, 110, 34);
    g.fillStyle = '#f4e0c0';
    g.fillRect(200, 76, 110, 4);
    for (let i = 0; i < 6; i++) {
      const x = 20 + random() * 470;
      if (random() < 0.5) {
        g.fillStyle = '#2a4a2a';
        g.beginPath();
        g.arc(x, 74, 14, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#5a3a2a';
        g.fillRect(x - 6, 86, 12, 26);
      } else {
        g.fillStyle = ['#2a2a3a', '#7a2a4a', '#1a3a4a'][i % 3]!;
        g.fillRect(x - 5, 66, 10, 46);
        g.beginPath();
        g.arc(x, 60, 6, 0, Math.PI * 2);
        g.fill();
      }
    }
    // The terrazzo floor and the glazing bars.
    g.fillStyle = 'rgba(240,220,200,0.6)';
    g.fillRect(0, 112, 512, 16);
    g.fillStyle = '#1a1a22';
    for (let x = 0; x <= 512; x += 64) g.fillRect(x - 3, 0, 6, 128);
    g.fillRect(0, 0, 512, 5);
    g.fillRect(0, 122, 512, 6);
  });
}

/** A marquee's fascia: two rows of chase-light bulbs on a dark band. */
function bulbTexture(): CanvasTexture {
  return canvasTexture(256, 16, (g) => {
    g.fillStyle = '#1a1420';
    g.fillRect(0, 0, 256, 16);
    for (let x = 4; x < 256; x += 8)
      for (const y of [4, 12]) {
        g.fillStyle = (x / 8 + y) % 3 === 0 ? '#fff0c0' : '#ffd070';
        g.beginPath();
        g.arc(x, y, 2.4, 0, Math.PI * 2);
        g.fill();
      }
  });
}

/** Headlight beams on a wet road: two warm cones spreading and fading ahead of the car. */
function beamTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    for (const cx of [22, 42]) {
      const fall = g.createLinearGradient(0, 256, 0, 0);
      fall.addColorStop(0, 'rgba(255,240,210,0.7)');
      fall.addColorStop(1, 'rgba(255,240,210,0)');
      g.fillStyle = fall;
      g.beginPath();
      g.moveTo(cx - 3, 256);
      g.lineTo(cx + 3, 256);
      g.lineTo(cx + 14, 0);
      g.lineTo(cx - 14, 0);
      g.closePath();
      g.fill();
    }
  });
}

/** Broken lines of foam, bright where the wave curls and lacy behind it. */
function foamTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const random = seeded(8241);
    for (let i = 0; i < 260; i++) {
      const x = Math.abs(random() - random()) * 64;
      const a = 0.25 + (1 - x / 64) * 0.6 * random();
      g.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      g.fillRect(x, random() * 256, 1 + random() * 3, 4 + random() * 20);
    }
  });
}

/** A hotel's name in looping neon script, a tube of light with its glow, on clear glass. */
function scriptTexture(name: string, glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  const title = name.charAt(0) + name.slice(1).toLowerCase();
  return canvasTexture(512, 128, (g) => {
    g.font = 'italic bold 84px "Brush Script MT", "Segoe Script", cursive, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = colour;
    g.shadowBlur = 18;
    g.lineWidth = 7;
    g.strokeStyle = colour;
    g.strokeText(title, 256, 66);
    g.shadowBlur = 0;
    g.lineWidth = 2.5;
    g.strokeStyle = '#ffffff';
    g.strokeText(title, 256, 66);
    // The underline swash.
    g.lineWidth = 5;
    g.strokeStyle = colour;
    g.beginPath();
    g.moveTo(90, 112);
    g.quadraticCurveTo(256, 96, 430, 110);
    g.stroke();
  });
}

/** Block capitals in neon tube on a dark sign box: VACANCY, OPEN and the like. */
function neonWordTexture(text: string, colour: string): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = 'rgba(16,10,20,0.85)';
    g.fillRect(0, 0, 256, 64);
    g.font = 'bold 36px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = colour;
    g.shadowBlur = 12;
    g.fillStyle = colour;
    g.fillText(text, 128, 34, 240);
    g.shadowBlur = 0;
    g.fillStyle = '#ffd8dc';
    g.fillText(text, 128, 34, 240);
  });
}

/** Uplight on a trunk: bright at the foot, fading as it climbs, streaked by the bark rings. */
function uplightTexture(): CanvasTexture {
  return canvasTexture(16, 128, (g) => {
    const fade = g.createLinearGradient(0, 128, 0, 0);
    fade.addColorStop(0, 'rgba(255,255,255,0.9)');
    fade.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 16, 128);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let y = 0; y < 128; y += 9) g.fillRect(0, y, 16, 2);
  });
}

/** A green street-name sign with a white border: OCEAN DR one side, a numbered street the other. */
function streetSignTexture(): CanvasTexture {
  return canvasTexture(256, 48, (g) => {
    g.fillStyle = '#0f6a3a';
    g.fillRect(0, 0, 256, 48);
    g.strokeStyle = '#f4f4f0';
    g.lineWidth = 3;
    g.strokeRect(4, 4, 248, 40);
    g.fillStyle = '#f4f4f0';
    g.font = 'bold 28px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('OCEAN DR', 128, 26);
  });
}

/**
 * The glitter of a moon path: short bright dashes across the swell, thick down the middle and
 * thinning to nothing at the sides.
 */
function glitterTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    const random = seeded(8251);
    for (let i = 0; i < 1400; i++) {
      const spread = (random() + random() + random()) / 3;
      const x = spread * 128;
      const edge = 1 - Math.abs(spread - 0.5) * 2;
      g.fillStyle = `rgba(255,255,255,${(edge * (0.3 + random() * 0.7)).toFixed(2)})`;
      g.fillRect(x - 4, random() * 512, 3 + random() * 10 * edge, 1 + random() * 3);
    }
  });
}

/** The sea wall's face: pastel stucco panels framed by pilasters every 4 m. */
function seaWallTexture(): CanvasTexture {
  return canvasTexture(32, 128, (g) => {
    speckle(g, 32, 128, '#c8b0c8', 8271);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, 0, 32, 10);
    g.fillStyle = 'rgba(60,40,70,0.35)';
    g.fillRect(0, 10, 32, 2);
    g.fillRect(4, 18, 24, 2);
    g.fillRect(4, 118, 24, 2);
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.fillRect(4, 20, 2, 98);
  });
}

/** A soft rectangular glow: bright across its middle, falling away to nothing at its edges. */
function auraTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const across = g.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(255,255,255,0)');
    across.addColorStop(0.5, 'rgba(255,255,255,1)');
    across.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = across;
    g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = 'destination-in';
    const down = g.createLinearGradient(0, 0, 0, 64);
    down.addColorStop(0, 'rgba(0,0,0,0)');
    down.addColorStop(0.25, 'rgba(0,0,0,1)');
    down.addColorStop(0.75, 'rgba(0,0,0,1)');
    down.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = down;
    g.fillRect(0, 0, 64, 64);
  });
}
