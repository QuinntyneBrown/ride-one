// Neon Docklands' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): glass
// and concrete towers after dark on both sides of the road, their windows lit at random and a
// neon sign down some of their faces. The towers repeat along a loop longer than the road in
// view, so the street never ends.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
} from 'three/webgpu';

/** Metres from the road's edge to the nearest tower face: the quay's pavement between. */
const SETBACK = 11;
/** The street repeats every LOOP metres; towers run from BEHIND metres behind the rider. */
const LOOP = 640;
const BEHIND = 30;
/** Towers reach below the road, so a ramp never shows their footing. */
const FOOTING = 6;
/** One window texture tile covers this many metres of façade, across and up. */
const TILE = 24;
/** The neon colours of the signs: magenta, cyan, volt and violet. */
const NEON = ['#ff4fb8', '#3fe0ff', '#d8ff3e', '#9b6bff'];
/** What the blade signs spell, top to bottom. */
const SIGN_WORDS = ['HOTEL', 'NOODLES', 'BAR', 'DOCK 9', 'CLUB', 'OPEN', 'RAMEN', 'CAFE'];
/**
 * The harbour: along this stretch of the loop, in metres, the left side has no towers and the
 * quay looks over the water to the far shore, FAR_SHORE metres away.
 */
const HARBOUR_FROM = 20;
const HARBOUR_TO = 250;
const FAR_SHORE = 340;
/**
 * The bridge ramps: the road over an effort crosses open dock on a bridge with steel parapets
 * PARAPET metres high, held by a pylon PYLON metres tall with CABLES stays each way.
 */
const PARAPET = 1.15;
const PYLON = 38;
const PYLON_INTO = 46;
const CABLES = 9;
const CABLE_EVERY = 9;
/** A blade sign stands out this far from its façade. */
const BLADE = 2;
/** The harbour skyline stands this far ahead, past the street's fog, and keeps its distance. */
const SKYLINE_AHEAD = 700;
/** The quay's kerb stands this high above the road, and is this wide. */
const KERB = 0.2;
const KERB_WIDTH = 0.3;
/** The pavement's slabs: two to a texture tile, each this many metres square. */
const SLAB = 1.5;
/**
 * Street lamps stand on alternate sides every LAMP_EVERY metres, LAMP_OUT metres from the
 * road's centre, where world-renderer.ts puts the night's point lights; their heads are
 * LAMP_HEIGHT metres above the road.
 */
const LAMP_EVERY = 40;
const LAMP_FIRST = 8;
const LAMP_OUT = 5;
const LAMP_HEIGHT = 6;
const LAMPS = 10;
/** The towers' street floor: glazing this high above the pavement, in bays this wide. */
const LOBBY = 4.6;
const LOBBY_BAY = 6;

interface Tower {
  readonly mesh: Mesh;
  readonly side: -1 | 1;
  readonly offset: number;
  readonly width: number;
  readonly depth: number;
}

export class DocklandsStreet {
  readonly group = new Group();
  private readonly towers: Tower[] = [];
  private readonly random = seeded(41);
  private readonly skyline = new Group();
  private readonly farShore = new Group();
  private readonly lamps: Group[] = [];
  private streakTexture: CanvasTexture | null = null;
  private readonly streakMaterials = new Map<string, MeshBasicMaterial>();
  private readonly streakPlane = new PlaneGeometry(1, 1);
  private readonly ribbons: {
    geometry: BufferGeometry;
    profile: [number, number][];
    /** The cross-section on a bridge, point for point; the quay's own where omitted. */
    bridge?: [number, number][];
  }[] = [];
  /** Whether the road `metres` ahead is on a bridge ramp; set by the renderer each frame. */
  private onBridge: (metres: number) => boolean = () => false;
  private readonly pylon = new Group();
  private cables: LineSegments | null = null;

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.addQuay(roadHalf, points);
    this.addLamps();
    const roof = new MeshStandardMaterial({ color: 0x0c0e16, roughness: 0.9 });
    // Three façades: blue glass, grey concrete and dark curtain wall, each lit its own way.
    const facades = [
      { base: '#1b2033', lit: ['#ffd9a0', '#9fd8ff', '#ffffff'], share: 0.34 },
      { base: '#272631', lit: ['#ffe2b0', '#ffc77a'], share: 0.22 },
      { base: '#12151f', lit: ['#7fb8ff', '#c6e6ff', '#ff9ad5'], share: 0.18 },
    ].map(({ base, lit, share }, i) => {
      const texture = this.track(windowTexture(base, lit, share, 101 + i * 17));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.9,
        roughness: 0.35,
        metalness: 0.3,
      });
    });
    // One blade sign material for each word, in a neon colour of its own.
    const blades = SIGN_WORDS.map((word, i) => {
      const texture = this.track(bladeTexture(word, NEON[i % NEON.length]!));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 1.8,
        roughness: 0.5,
        side: DoubleSide,
      });
    });
    const lobbies = [
      { glass: '#ffd9a6', frame: '#1a1b22', dark: 0.15 },
      { glass: '#bfe6ff', frame: '#22242c', dark: 0.3 },
      { glass: '#ffe9c9', frame: '#2a1f24', dark: 0.45 },
    ].map(({ glass, frame, dark }, i) => {
      const texture = this.track(lobbyTexture(glass, frame, dark, 211 + i * 31));
      texture.wrapS = RepeatWrapping;
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.75,
        roughness: 0.25,
        metalness: 0.2,
      });
    });
    const canopyMaterial = new MeshStandardMaterial({
      color: 0x101218,
      metalness: 0.5,
      roughness: 0.45,
    });
    const lobbyRandom = seeded(97);
    const blade = new PlaneGeometry(BLADE, 1);
    const bracket = new BoxGeometry(BLADE + 0.3, 0.12, 0.12);
    this.disposables.push(...lobbies, canopyMaterial, blade, bracket);
    this.disposables.push(roof, ...facades, ...blades);

    for (const side of [-1, 1] as const) {
      let offset = 0;
      while (offset < LOOP) {
        if (side < 0 && offset >= HARBOUR_FROM && offset < HARBOUR_TO) {
          offset = HARBOUR_TO;
          continue;
        }
        const width = 14 + this.random() * 16;
        const depth = 14 + this.random() * 14;
        const height = 24 + this.random() ** 2 * 120;
        const facade = facades[Math.floor(this.random() * facades.length)]!;
        const geometry = towerGeometry(width, height + FOOTING, depth);
        this.disposables.push(geometry);
        // Faces are +x, -x, top, bottom, +z, -z.
        const mesh = new Mesh(geometry, [facade, facade, roof, roof, facade, facade]);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.userData['height'] = height;
        // The street floor: lit glazing towards the road under a dark canopy.
        const street = -(height - FOOTING) / 2 + KERB;
        const length = depth - 2;
        const glazing = new PlaneGeometry(length, LOBBY);
        const uv = glazing.getAttribute('uv');
        for (let v = 0; v < uv.count; v++) uv.setX(v, (uv.getX(v) * length) / LOBBY_BAY);
        const lobby = new Mesh(glazing, lobbies[Math.floor(lobbyRandom() * lobbies.length)]!);
        lobby.rotation.y = (-side * Math.PI) / 2;
        lobby.position.set(-side * (width / 2 + 0.04), street + LOBBY / 2, 0);
        const canopyBox = new BoxGeometry(1.8, 0.22, length);
        const canopy = new Mesh(canopyBox, canopyMaterial);
        canopy.position.set(-side * (width / 2 + 0.9), street + LOBBY + 0.2, 0);
        canopy.castShadow = true;
        this.disposables.push(glazing, canopyBox);
        mesh.add(lobby, canopy);
        if (this.random() < 0.45) {
          // A blade sign stands out from the façade over the canopy, read down the street.
          const word = Math.floor(this.random() * blades.length);
          const material = blades[word]!;
          const tall = Math.min(height * 0.4, 6 + this.random() * 10);
          this.random();
          const lift = this.random() * height * 0.15;
          const along = (this.random() - 0.5) * (depth - 4);
          const sign = new Mesh(blade, material);
          sign.scale.y = tall;
          const out = -side * (width / 2 + BLADE / 2 + 0.15);
          const foot = street + LOBBY + 1.6 + lift;
          sign.position.set(out, foot + tall / 2, along);
          mesh.add(sign);
          // Its colour reflects on the wet pavement below, towards the road.
          this.streak(
            mesh,
            NEON[word % NEON.length]!,
            out - side * 2.5,
            street,
            along - 1,
            10,
            2.2,
            1.4,
          );
          for (const y of [foot + 0.4, foot + tall - 0.4]) {
            const arm = new Mesh(bracket, canopyMaterial);
            arm.position.set(out, y, along);
            mesh.add(arm);
          }
        }
        this.group.add(mesh);
        this.towers.push({ mesh, side, offset: offset + depth / 2, width, depth });
        // A lane or a plaza between some towers lets the distance through.
        offset += depth + (this.random() < 0.3 ? 8 + this.random() * 18 : 1.5);
      }
    }
    this.roadHalf = roadHalf;
    this.addSkyline(facades, roof);
    this.addFarShore(facades, roof);
  }

  /**
   * The harbour city across the water at the end of the street: a band of towers in depth and
   * a landmark tower with a lit crown and spire. Like Old Town's cathedral it stands a fixed
   * distance ahead, out of the fog, which would hide it; its façades are dimmed by hand.
   */
  private addSkyline(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(73);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.75;
      material.color.multiplyScalar(0.6);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    for (let i = 0; i < 46; i++) {
      // Taller towers gather towards the middle, as a business district does.
      const x = (random() * 2 - 1) ** 3 * 420;
      const centre = 1 - Math.min(Math.abs(x) / 420, 1);
      const height = 40 + random() * 70 + centre * random() * 160;
      const width = 18 + random() * 26;
      const depth = 18 + random() * 20;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, -random() * 260);
      this.skyline.add(mesh);
    }
    this.addLandmark(far[0]!, top);
    this.group.add(this.skyline);
  }

  /**
   * The city across the harbour, on the left: lit towers along the far shore. It keeps its
   * distance, like the skyline.
   */
  private addFarShore(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(131);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.8;
      material.color.multiplyScalar(0.5);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    for (let z = 80; z > -760;) {
      const width = 16 + random() * 24;
      const depth = 16 + random() * 18;
      const height = 30 + random() ** 1.5 * 150;
      const x = -FAR_SHORE - depth / 2 - random() * 120;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, z - width / 2);
      this.farShore.add(mesh);
      z -= width + 2 + random() * 10;
    }
    this.group.add(this.farShore);
  }

  /** The tallest tower on the skyline: stepped, with a magenta crown and a lit spire. */
  private addLandmark(facade: MeshStandardMaterial, top: MeshStandardMaterial): void {
    const glow = (hex: string, strength: number) =>
      new MeshStandardMaterial({
        color: 0x000000,
        emissive: new Color(hex),
        emissiveIntensity: strength,
        fog: false,
      });
    const crown = glow('#ff4fb8', 2.2);
    const spire = glow('#ffe7f6', 2.6);
    const beacon = glow('#ff2a2a', 3);
    this.disposables.push(crown, spire, beacon);
    const landmark = new Group();
    let y = 0;
    for (const [width, height] of [
      [46, 190],
      [36, 70],
      [26, 46],
    ] as const) {
      const geometry = towerGeometry(width, height, width);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.y = y + height / 2;
      landmark.add(mesh);
      y += height;
    }
    const band = new BoxGeometry(27, 6, 27);
    const needle = new BoxGeometry(1.4, 60, 1.4);
    const lamp = new BoxGeometry(3, 3, 3);
    this.disposables.push(band, needle, lamp);
    const ring = new Mesh(band, crown);
    ring.position.y = y - 10;
    const mast = new Mesh(needle, spire);
    mast.position.y = y + 30;
    const light = new Mesh(lamp, beacon);
    light.position.y = y + 61;
    landmark.add(ring, mast, light);
    landmark.position.set(-24, 0, -60);
    this.skyline.add(landmark);
  }

  private roadHalf = 3.5;

  /**
   * The quay along both sides: a granite kerb, wet concrete slabs back to the towers, and a
   * neon line along the road's edge in the magenta of the mock.
   */
  private addQuay(roadHalf: number, points: number): void {
    const slabs = this.track(slabTexture());
    slabs.repeat.set(1 / (2 * SLAB), 1 / (2 * SLAB));
    const pavement = new MeshStandardMaterial({
      map: slabs,
      color: 0x8a8fa6,
      roughness: 0.42,
      metalness: 0.1,
      side: DoubleSide,
    });
    const kerb = new MeshStandardMaterial({ color: 0x6d7182, roughness: 0.6, side: DoubleSide });
    const neon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff5fc4'),
      emissiveIntensity: 2.6,
      side: DoubleSide,
    });
    const water = new MeshStandardMaterial({
      color: 0x060a16,
      roughness: 0.12,
      metalness: 0.85,
      side: DoubleSide,
    });
    const steel = new MeshStandardMaterial({
      color: 0x1c2030,
      metalness: 0.7,
      roughness: 0.35,
      side: DoubleSide,
    });
    const rail = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#3fe0ff'),
      emissiveIntensity: 2.4,
      side: DoubleSide,
    });
    this.disposables.push(pavement, kerb, neon, water, steel, rail);
    this.addPylon(roadHalf);
    const back = roadHalf + SETBACK + 2;
    const edge = roadHalf + KERB_WIDTH;
    for (const side of [-1, 1]) {
      // Each cross-section runs from left to right, so every strip faces up.
      const across = (profile: [number, number][]) =>
        side < 0 ? profile.map(([x, y]) => [-x, y] as [number, number]).reverse() : profile;
      this.ribbon(
        points,
        kerb,
        across([
          [roadHalf, -0.05],
          [roadHalf, KERB],
          [edge, KERB],
        ]),
      );
      // On a bridge the pavement gives way to the parapet, and the dock is open beyond it.
      this.ribbon(
        points,
        pavement,
        across([
          [edge, KERB],
          [back, KERB],
        ]),
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
      );
      this.ribbon(
        points,
        steel,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge, KERB],
          [edge, KERB + PARAPET],
        ]),
      );
      this.ribbon(
        points,
        rail,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge - 0.08, KERB + PARAPET],
          [edge + 0.08, KERB + PARAPET],
        ]),
      );
      this.ribbon(
        points,
        neon,
        across([
          [roadHalf - 0.42, 0.012],
          [roadHalf - 0.22, 0.012],
        ]),
      );
      if (side < 0) {
        // The harbour water beyond the quay, and the quay's stone face down to it.
        this.ribbon(points, water, [
          [-FAR_SHORE - 200, -0.03],
          [-back, -0.03],
        ]);
        this.ribbon(points, kerb, [
          [-back, -0.03],
          [-back, KERB],
        ]);
      }
    }
  }

  /**
   * A light's reflection on the wet ground (technique 14): a soft streak of its colour lying
   * on the surface, brightest under the light and drawn out towards the rider, as lights smear
   * on wet asphalt at night. Its far end is at (x, y, z) in `parent`'s frame.
   */
  private streak(
    parent: Group | Mesh,
    hex: string,
    x: number,
    y: number,
    z: number,
    length: number,
    width: number,
    strength: number,
  ): void {
    if (!this.streakTexture) {
      this.streakTexture = this.track(streakTexture());
      this.disposables.push(this.streakPlane);
    }
    const key = `${hex}/${strength}`;
    let material = this.streakMaterials.get(key);
    if (!material) {
      material = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(strength),
        map: this.streakTexture,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      this.streakMaterials.set(key, material);
      this.disposables.push(material);
    }
    const mesh = new Mesh(this.streakPlane, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(width, length, 1);
    mesh.position.set(x, y + 0.015, z + length / 2);
    mesh.renderOrder = 1;
    parent.add(mesh);
  }

  /** Slim dark poles with a glowing globe on top, as in the mock. */
  private addLamps(): void {
    const metal = new MeshStandardMaterial({ color: 0x15171d, metalness: 0.6, roughness: 0.4 });
    const globe = new MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: new Color(0xffe2b0),
      emissiveIntensity: 3,
    });
    const pole = new CylinderGeometry(0.06, 0.09, LAMP_HEIGHT - KERB, 8);
    const foot = new CylinderGeometry(0.16, 0.2, 0.5, 10);
    const head = new SphereGeometry(0.26, 16, 12);
    const collar = new CylinderGeometry(0.12, 0.08, 0.16, 10);
    this.disposables.push(metal, globe, pole, foot, head, collar);
    for (let i = 0; i < LAMPS; i++) {
      const lamp = new Group();
      const shaft = new Mesh(pole, metal);
      shaft.position.y = KERB + (LAMP_HEIGHT - KERB) / 2 - 0.3;
      shaft.castShadow = true;
      const base = new Mesh(foot, metal);
      base.position.y = KERB + 0.25;
      const cup = new Mesh(collar, metal);
      cup.position.y = LAMP_HEIGHT - 0.28;
      const light = new Mesh(head, globe);
      light.position.y = LAMP_HEIGHT;
      lamp.add(shaft, base, cup, light);
      // Lamps stand on the left at even places: their light reflects on the road inside them.
      const inward = i % 2 === 0 ? 1 : -1;
      this.streak(lamp, '#ffd9a0', inward * 1.6, 0, -0.5, 14, 2.2, 2.6);
      this.streak(lamp, '#ffd9a0', 0, KERB, -0.5, 6, 1.4, 1);
      this.lamps.push(lamp);
      this.group.add(lamp);
    }
  }

  /**
   * The bridge's pylon: an A-frame over the road whose legs stand on the deck's edges, lit
   * along its edges, with a beacon at the top. Its stays fan down to both parapets.
   */
  private addPylon(roadHalf: number): void {
    const concrete = new MeshStandardMaterial({ color: 0x2a2e3c, roughness: 0.6 });
    const edgeLight = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#3fe0ff'),
      emissiveIntensity: 2,
    });
    const beacon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3,
    });
    const foot = roadHalf + 1.2;
    const leg = new BoxGeometry(1.2, Math.hypot(PYLON, foot), 1.6);
    const strip = new BoxGeometry(0.14, Math.hypot(PYLON, foot), 0.14);
    const lamp = new BoxGeometry(1, 1, 1);
    const stays = new LineBasicMaterial({ color: 0x9fdcff });
    this.disposables.push(concrete, edgeLight, beacon, leg, strip, lamp, stays);
    const lean = Math.atan2(foot, PYLON);
    for (const side of [-1, 1]) {
      const mesh = new Mesh(leg, concrete);
      mesh.position.set((side * foot) / 2, PYLON / 2, 0);
      mesh.rotation.z = side * lean;
      mesh.castShadow = true;
      const light = new Mesh(strip, edgeLight);
      light.position.set((side * foot) / 2, PYLON / 2, 0.85);
      light.rotation.z = side * lean;
      this.pylon.add(mesh, light);
    }
    const top = new Mesh(lamp, beacon);
    top.position.y = PYLON + 0.6;
    this.pylon.add(top);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(2 * 2 * 2 * CABLES * 3), 3),
    );
    this.disposables.push(geometry);
    this.cables = new LineSegments(geometry, stays);
    this.cables.frustumCulled = false;
    this.pylon.visible = false;
    this.cables.visible = false;
    this.group.add(this.pylon, this.cables);
  }

  /** Tells the street which stretches of the road ahead are bridge ramps. */
  setBridge(onBridge: (metres: number) => boolean): void {
    this.onBridge = onBridge;
  }

  /** Stands the pylon PYLON_INTO metres onto the first bridge in view, and hangs its stays. */
  private placePylon(heightAt: (metres: number) => number): void {
    const cables = this.cables;
    if (!cables) return;
    let start: number | null = null;
    for (let m = -40; m <= 300; m += 2) {
      if (this.onBridge(Math.max(m, 0)) && (m <= -40 || !this.onBridge(Math.max(m - 2, 0)))) {
        start = m;
        break;
      }
    }
    const at = start === null ? 0 : start + PYLON_INTO;
    const visible = start !== null && this.onBridge(Math.max(at, 0));
    this.pylon.visible = visible;
    cables.visible = visible;
    if (!visible) return;
    const base = heightAt(Math.max(at, 0));
    this.pylon.position.set(0, base, -at);
    const position = cables.geometry.getAttribute('position') as BufferAttribute;
    const edge = this.roadHalf + KERB_WIDTH;
    let v = 0;
    for (const side of [-1, 1]) {
      for (const way of [-1, 1]) {
        for (let k = 1; k <= CABLES; k++) {
          const m = at + way * k * CABLE_EVERY;
          position.setXYZ(v++, (side * 0.6 * (PYLON - k)) / PYLON, base + PYLON - 1 - k * 0.6, -at);
          position.setXYZ(v++, side * edge, heightAt(Math.max(m, 0)) + KERB + PARAPET, -m);
        }
      }
    }
    position.needsUpdate = true;
  }

  /** A strip along the road whose cross-section is `profile`: [x, height above the road]. */
  private ribbon(
    points: number,
    material: Material,
    profile: [number, number][],
    bridge?: [number, number][],
  ): void {
    const n = profile.length;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(points * n * 3), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(points * n * 2), 2));
    const index: number[] = [];
    for (let i = 0; i < points - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        const a = i * n + j;
        index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
      }
    }
    geometry.setIndex(index);
    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    this.ribbons.push({ geometry, profile, bridge });
    this.disposables.push(geometry);
  }

  /** Lays the quay over the road's points; its slabs move with the rider's distance `s`. */
  lay(points: readonly { metres: number; height: number }[], s: number): void {
    const bridged = points.map((p) => this.onBridge(Math.max(p.metres, 0)));
    for (const { geometry, profile, bridge } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      const n = profile.length;
      points.forEach((p, i) => {
        const section = bridge && bridged[i] ? bridge : profile;
        section.forEach(([x, y], j) => {
          position.setXYZ(i * n + j, x, p.height + y, -p.metres);
          uv.setXY(i * n + j, x, p.metres + s);
        });
      });
      position.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
  }

  /** Moves each tower to its place along the loop for the rider's distance `s`. */
  place(s: number, heightAt: (metres: number) => number): void {
    for (const tower of this.towers) {
      const metres = ((((tower.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const height = tower.mesh.userData['height'] as number;
      // A bridge crosses open dock: no tower stands beside it.
      tower.mesh.visible = ![-tower.depth / 2, 0, tower.depth / 2].some((d) =>
        this.onBridge(Math.max(metres + d, 0)),
      );
      tower.mesh.position.set(
        tower.side * (this.roadHalf + SETBACK + tower.width / 2),
        heightAt(Math.max(metres, 0)) + (height - FOOTING) / 2,
        -metres,
      );
    }
    this.lamps.forEach((lamp, i) => {
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + LAMP_FIRST;
      lamp.position.set(i % 2 === 0 ? -LAMP_OUT : LAMP_OUT, heightAt(metres), -metres);
      lamp.visible = !this.onBridge(Math.max(metres, 0));
    });
    this.placePylon(heightAt);
    this.skyline.position.set(0, heightAt(1e6) - 4, -SKYLINE_AHEAD);
    this.farShore.position.set(0, heightAt(0), 0);
  }
}

/** A box whose side faces repeat the window tile once every TILE metres. */
function towerGeometry(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const uv = geometry.getAttribute('uv');
  // Four vertices per face, faces in the order +x, -x, +y, -y, +z, -z.
  const across = [depth, depth, width, width, width, width];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, (uv.getX(i) * across[face]!) / TILE, (uv.getY(i) * height) / TILE);
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * A façade at night: dark glazing in a grid of floors and bays, a `share` of the windows lit
 * in one of the `lit` colours. The same texture is the emissive map, so only the lit windows
 * glow.
 */
function windowTexture(base: string, lit: string[], share: number, seed: number): CanvasTexture {
  const size = 256;
  const cols = 16;
  const rows = 7;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const w = size / cols;
    const h = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = random() < share;
        ctx.fillStyle = on ? lit[Math.floor(random() * lit.length)]! : base;
        ctx.globalAlpha = on ? 0.55 + random() * 0.45 : 1;
        ctx.fillRect(c * w + 3, r * h + 6, w - 6, h - 16);
      }
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A reflection streak: white, brightest at its far (top) end and along its middle, fading to
 * nothing at its sides and towards the rider.
 */
function streakTexture(): CanvasTexture {
  const width = 64;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      // v runs from the far end (0) to the near end (1).
      const v = y / (height - 1);
      const along = Math.pow(1 - v, 1.6) * Math.min(1, v * 12 + 0.3);
      for (let x = 0; x < width; x++) {
        const u = (x / (width - 1)) * 2 - 1;
        const across = Math.exp(-u * u * 5);
        const a = Math.round(255 * along * across);
        const i = (y * width + x) * 4;
        image.data[i] = a;
        image.data[i + 1] = a;
        image.data[i + 2] = a;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A blade sign at night: `word` in neon tube letters stacked top to bottom on a dark panel,
 * with the tube's glow around them and a thin neon border.
 */
function bladeTexture(word: string, colour: string): CanvasTexture {
  const width = 96;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0c12';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    const letters = [...word];
    const step = (height - 40) / Math.max(letters.length, 4);
    ctx.font = `bold ${Math.floor(Math.min(step * 0.8, 70))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    const top = height / 2 - (step * letters.length) / 2 + step / 2;
    letters.forEach((letter, i) => {
      ctx.shadowBlur = 16;
      ctx.strokeText(letter, width / 2, top + i * step);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(letter, width / 2, top + i * step);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4;
      ctx.strokeStyle = colour;
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * One bay of a tower's street floor at night: tall glass panels in a dark frame, lit from
 * inside, with a darker transom above; some bays are dark. Six panels wide per tile.
 */
function lobbyTexture(glass: string, frame: string, dark: number, seed: number): CanvasTexture {
  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, width, height);
    const panels = 4;
    const w = width / panels;
    for (let i = 0; i < panels; i++) {
      const lit = random() >= dark;
      const g = ctx.createLinearGradient(0, 20, 0, height);
      g.addColorStop(0, lit ? glass : '#1d2030');
      g.addColorStop(1, lit ? '#ffffff' : '#2a2d3e');
      ctx.globalAlpha = lit ? 0.75 + random() * 0.25 : 1;
      ctx.fillStyle = g;
      ctx.fillRect(i * w + 4, 24, w - 8, height - 30);
      // A transom light over each panel.
      ctx.fillStyle = lit ? glass : '#1d2030';
      ctx.globalAlpha = lit ? 0.45 : 1;
      ctx.fillRect(i * w + 4, 6, w - 8, 12);
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Wet concrete slabs at night: two by two, with dark joints and a little grit. */
function slabTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(19);
    const slab = size / 2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const shade = 150 + Math.floor(random() * 30);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`;
        ctx.fillRect(col * slab, row * slab, slab, slab);
      }
    }
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.fillStyle = 'rgba(20,20,30,0.7)';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, slab, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(slab, 0, 2, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function seeded(seed: number): () => number {
  let state = seed % 2147483647 || 1;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}
