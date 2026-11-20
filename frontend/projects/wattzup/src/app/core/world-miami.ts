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
  private water: Texture | null = null;
  private readonly signs: MeshStandardMaterial[] = [];
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flat = new PlaneGeometry(1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.flat);
    this.addRoad(roadHalf, points);
    this.addHotels(roadHalf);
    this.addPalms(roadHalf);
    this.addLamps(roadHalf);
    this.addCars(roadHalf);
    this.addPeople(roadHalf);
    this.addBay();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.water) this.water.offset.set(seconds * 0.004, seconds * 0.002);
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
          heightAt(Math.max(metres, 0)) + bob,
          -metres,
          p.speed >= 0 ? 0 : Math.PI,
          0.98,
          0,
        );
      });
      crowd.commit();
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
    const paving = this.material({ map: this.repeat(pavingTexture(), 3, 3), roughness: 0.4 });
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
    this.ribbons.add(points, paving, [
      [-r - 0.25, 0.15],
      [-r - 5, 0.15],
    ]);
    // The low promenade wall, lit along its top by the hotels.
    this.ribbons.add(points, kerb, [
      [-r - 5, 0.15],
      [-r - 5, 0.75],
      [-r - 5.5, 0.75],
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
    let offset = 0;
    let k = 0;
    while (offset < LOOP - 10) {
      const width = 22 + random() * 14;
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
      const blade = new Mesh(this.unit, sign);
      blade.scale.set(3.2, Math.min(height + 2, 15), 0.5);
      blade.position.set(-1.6, Math.min(height + 2, 15) / 2 + 2.4, width * 0.3);
      hotel.add(blade);
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
    for (let offset = 0; offset < LOOP; offset += 14 + random() * 4)
      for (const side of [-1, 1]) {
        const p = palms.make(random);
        p.scale.multiplyScalar(1.2);
        const lamp = new Mesh(this.unit, uplight);
        lamp.scale.set(0.3, 0.12, 0.3);
        lamp.position.y = 0.2;
        const holder = new Group();
        holder.add(p, lamp);
        holder.position.y = 0.15;
        this.group.add(holder);
        const x = side > 0 ? roadHalf + 2 : -roadHalf - 2.6;
        this.props.push({ mesh: holder, offset: offset + (side > 0 ? 0 : 7), x });
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
      this.props.push({ mesh: holder, offset: 40 + k * 46 + random() * 8, x: roadHalf - 1.1 });
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

  /** People out for the night on both sidewalks. */
  private addPeople(roadHalf: number): void {
    const random = seeded(8131);
    for (let k = 0; k < 30; k++) {
      const right = k % 3 !== 0;
      this.people.push({
        offset: random() * LOOP,
        x: right ? roadHalf + 1 + random() * 5 : -roadHalf - 1 - random() * 3,
        speed: (random() < 0.5 ? -1 : 1) * (0.7 + random() * 0.6),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, NIGHT_WEAR, 8137);
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
    for (let k = 0; k < 26; k++) {
      const h = 60 + random() * 180;
      const t = new Mesh(this.unit, towers[k % towers.length]!);
      t.scale.set(30 + random() * 30, h, 30 + random() * 20);
      const x = -900 + k * 70 + random() * 30;
      t.position.set(x, h / 2 - SEA, -1500 - random() * 300);
      this.horizon.add(t);
      if (random() < 0.5) {
        const c = new Mesh(this.unit, crowns[k % crowns.length]!);
        c.scale.set(t.scale.x * 1.02, 2, t.scale.z * 1.02);
        c.position.set(x, h - SEA, t.position.z);
        this.horizon.add(c);
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
    const shimmer = this.material({
      color: 0xc8d4ff,
      emissive: 0xc8d4ff,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      fog: false,
    });
    for (let k = 0; k < 40; k++) {
      const m = new Mesh(this.unit, shimmer);
      const d = 200 + k * 30;
      m.scale.set(4 + random() * 8 + k * 0.4, 0.05, 0.6);
      m.position.set(-120 - d * 0.6 + (random() - 0.5) * 10, -SEA, -d);
      this.horizon.add(m);
    }
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

/** Pale sidewalk slabs. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#9a96a0', 8161);
    g.strokeStyle = 'rgba(40,40,50,0.4)';
    g.strokeRect(0, 0, 64, 64);
    g.strokeRect(0, 0, 32, 32);
    g.strokeRect(32, 32, 32, 32);
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

/** A blade sign: the hotel's name in neon letters down a dark panel. */
function signTexture(name: string, glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  return canvasTexture(64, 512, (g) => {
    g.fillStyle = '#101018';
    g.fillRect(0, 0, 64, 512);
    g.strokeStyle = colour;
    g.lineWidth = 4;
    g.strokeRect(4, 4, 56, 504);
    g.fillStyle = colour;
    g.font = 'bold 44px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const letters = name.replace(/ /g, '').split('');
    const step = 480 / letters.length;
    letters.forEach((c, i) => g.fillText(c, 32, 22 + step * (i + 0.5)));
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
