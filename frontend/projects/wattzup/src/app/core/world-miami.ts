// Miami Neon Nights, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the beachfront
// boulevard of a Miami night, the road still wet from a passing shower. On the right a row of
// pastel art deco hotels, their eyebrow ledges and rooflines traced in neon tubes of pink, cyan,
// violet and green, a tall blade sign on each spelling the hotel's name; royal palms line the
// sidewalk and convertibles wait at the kerb, tail lights glowing. On the left a low wall, the
// sand and the dark Atlantic, a moon path shimmering on it; ahead, across the bay, a skyline of
// towers lit floor by floor. People stroll the sidewalks between the clubs. The hotels and their
// names are invented. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
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
  canvasTexture,
  Figures,
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
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private water: Texture | null = null;
  private readonly signs: MeshStandardMaterial[] = [];
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
    this.addRoad(roadHalf, points);
    this.addHotels(roadHalf);
    this.addPalms(roadHalf);
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
      map: this.repeat(roadTexture(), r * 2, 8),
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
      // The stepped deco crown at the centre of the roofline.
      const crown = new Mesh(this.unit, facade);
      crown.scale.set(4, 3.2, width * 0.3);
      crown.position.set(2, height + 1.6, 0);
      hotel.add(crown);
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
      run(height + 3.2, width * 0.3, 1.95);
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

  /** Convertibles parked at the kerb, chrome and candy paint, tail lights aglow. */
  private addCars(roadHalf: number): void {
    const random = seeded(8121);
    const paints = [0xff3f8a, 0x2fc8e6, 0xf4f0e8, 0x1d1f24, 0xffd23f].map((c) =>
      this.material({ color: c, roughness: 0.25, metalness: 0.5 }),
    );
    const chrome = this.material({ color: 0xd8dce4, roughness: 0.15, metalness: 1 });
    const seat = this.material({ color: 0xf4e8d8, roughness: 0.7 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const tail = this.material({ color: 0xff2030, emissive: 0xff2030, emissiveIntensity: 3 });
    const head = this.material({ color: 0xfff4d8, emissive: 0xfff4d8, emissiveIntensity: 2 });
    for (let k = 0; k < 7; k++) {
      const car = new Group();
      const paint = paints[k % paints.length]!;
      const body = new Mesh(this.unit, paint);
      body.scale.set(1.9, 0.65, 4.6);
      body.position.y = 0.6;
      const tub = new Mesh(this.unit, seat);
      tub.scale.set(1.6, 0.2, 1.8);
      tub.position.set(0, 0.98, 0.3);
      const screen = new Mesh(this.unit, chrome);
      screen.scale.set(1.7, 0.45, 0.05);
      screen.rotation.x = -0.4;
      screen.position.set(0, 1.15, -0.75);
      const bumper = new Mesh(this.unit, chrome);
      bumper.scale.set(1.95, 0.15, 4.75);
      bumper.position.y = 0.35;
      car.add(body, tub, screen, bumper);
      for (const x of [-0.7, 0.7]) {
        const t = new Mesh(this.unit, tail);
        t.scale.set(0.3, 0.12, 0.05);
        t.position.set(x, 0.75, 2.32);
        const h = new Mesh(this.unit, head);
        h.scale.set(0.3, 0.14, 0.05);
        h.position.set(x, 0.72, -2.32);
        car.add(t, h);
        for (const z of [-1.5, 1.5]) {
          const w = new Mesh(this.unit, tyre);
          w.scale.set(0.3, 0.62, 0.62);
          w.position.set(x * 1.3, 0.31, z);
          car.add(w);
        }
      }
      car.children.forEach((m) => (m.castShadow = true));
      car.rotation.y = (random() - 0.5) * 0.05;
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 40 + k * 52 + random() * 8, x: roadHalf - 1.1 });
    }
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
    const moon = new Mesh(
      new SphereGeometry(28, 24, 16),
      new MeshBasicMaterial({ color: 0xf4f0ff, fog: false }),
    );
    moon.position.set(-900, 520, -1900);
    this.disposables.push(glow, band.geometry, moon.geometry, moon.material);
    this.horizon.add(band, moon);
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

/** The wet black asphalt, its dashed centre line and the neon smeared in its puddles. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    speckle(g, 128, 256, '#26262c', 8151);
    const random = seeded(8153);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = ['rgba(255,63,180,0.18)', 'rgba(47,230,255,0.16)', 'rgba(180,107,255,0.14)'][
        i % 3
      ]!;
      g.fillRect(random() * 128, random() * 256, 2 + random() * 6, 18 + random() * 40);
    }
    g.fillStyle = '#e8e0c8';
    g.fillRect(62, 0, 4, 120);
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

/** A hotel's stucco front: storey bands, deco eyebrows and its window openings. */
function facadeTexture(storeys: number, seed: number): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#f4f0ec', seed);
    const band = 256 / storeys;
    for (let f = 0; f < storeys; f++) {
      g.fillStyle = 'rgba(80,70,90,0.25)';
      g.fillRect(0, f * band, 256, 4);
      for (let x = 14; x < 250; x += 38) {
        g.fillStyle = '#2a2a3a';
        g.fillRect(x, f * band + band * 0.3, 22, band * 0.5);
      }
    }
  });
}

/** The same windows, lit warm or dark, glowing through the night. */
function windowsTexture(storeys: number, seed: number): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(seed + 1);
    const band = 256 / storeys;
    for (let f = 0; f < storeys; f++)
      for (let x = 14; x < 250; x += 38) {
        if (random() < 0.45) continue;
        g.fillStyle = ['#ffd8a0', '#ffe8c8', '#ff9ec9', '#a8e8ff'][Math.floor(random() * 4)]!;
        g.fillRect(x, f * band + band * 0.3, 22, band * 0.5);
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
