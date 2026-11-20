// The World Ride scene drawn with Three.js's WebGPU renderer, on WebGPU or its WebGL2 backend
// (ADRs 0020, 0021). It and the scene parts it builds (world-oldtown.ts, world-cyclist.ts) are the
// only files that import Three.js; they are loaded on demand through world-renderer-loader.ts.
// Which techniques are drawn is decided by render-quality.ts (L2-111).
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import {
  convertToTexture,
  float,
  mrt,
  output,
  pass,
  screenUV,
  sin,
  smoothstep,
  time,
  vec2,
  vec4,
  velocity,
} from 'three/tsl';
import {
  AgXToneMapping,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Node,
  NoToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RenderPipeline,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import type { WorldId } from '@wattzup/api';
import { PACERS, pacersOnRoad } from './pacers';
import { type Backend, FrameBudget, startTier, techniquesAt, type Tier } from './render-quality';
import { MIN_SPEED, nextArch, roadAhead, type RoadPoint } from './scene-road';
import type { SceneFrame, WorldRenderer } from './world-renderer-port';
import { Cyclist, CyclistKit } from './world-cyclist';
import { DocklandsStreet } from './world-docklands';
import type { SceneStreet, StreetFactory } from './world-kit';
import { cobbleTextures, OldTownStreet } from './world-oldtown';
import { STREETS } from './world-streets';
import { targetGrade, type World } from './worlds';

interface Look {
  readonly sky: number;
  readonly fog: number;
  readonly ground: number;
  readonly road: number;
  /** The sun's elevation above the horizon, in degrees; below 0 is night. */
  readonly sun: number;
  /** A road wet from rain or spray (technique 14). */
  readonly wet: boolean;
  /** Shimmer over a hot road (technique 50). */
  readonly haze: boolean;
  /** The physical sky's haze and its blue (technique 11). */
  readonly turbidity?: number;
  readonly rayleigh?: number;
  /** Where the sun stands, in degrees from straight ahead; negative is left. */
  readonly azimuth?: number;
  /** The sun's strength and colour, and the sky's fill, where a scene sets its own. */
  readonly light?: { readonly sun: number; readonly fill: number; readonly colour: number };
  /** Where the fog starts and where it hides everything, in metres. */
  readonly fogRange?: readonly [number, number];
  /**
   * A night scene's key light, the moon over the city glow: its elevation and azimuth in
   * degrees, strength and colour, and the sky's fill with the colour it comes down in.
   */
  readonly moon?: {
    readonly elevation: number;
    readonly azimuth: number;
    readonly strength: number;
    readonly colour: number;
    readonly fill: number;
    readonly fillSky: number;
  };
}

/** The scenes ridden on Old Town's cobbles rather than tarmac. */
const COBBLED: ReadonlySet<WorldId> = new Set<WorldId>([
  'oldtown',
  'koppenberg',
  'champs',
  'montmartre',
]);

/** Until each scene's own look lands: sky, fog, ground, road, sun, wet and haze. */
const LOOKS: Record<WorldId, Look> = {
  docklands: {
    sky: 0x0b1030,
    // The street fades into the city's violet haze, the colour of the sky's glow at the horizon.
    fog: 0x2a2150,
    ground: 0x1c1e2b,
    road: 0x40434f,
    sun: -4,
    wet: true,
    haze: false,
    // Moonlight from behind the rider's left shoulder, and the violet glow of the city above.
    moon: {
      elevation: 34,
      azimuth: -150,
      strength: 1.6,
      colour: 0xaab8ff,
      fill: 2.2,
      fillSky: 0x6a5f9e,
    },
    fogRange: [40, 520],
  },
  granite: {
    sky: 0x8fb6d9,
    fog: 0xc9d6e2,
    ground: 0x5d6b4f,
    road: 0x4a4a4a,
    sun: 6,
    wet: false,
    haze: false,
  },
  oldtown: {
    sky: 0xa9c7e8,
    fog: 0xdcd8cf,
    ground: 0x6b6256,
    road: 0xd9d2c8,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 2.6,
    azimuth: -150,
    light: { sun: 3.5, fill: 1.0, colour: 0xffe2b6 },
    fogRange: [30, 430],
  },
  prairie: {
    sky: 0xf0c27b,
    fog: 0xf3d9a8,
    ground: 0xb49a4c,
    road: 0x555555,
    sun: 8,
    wet: false,
    haze: true,
  },
  dolomites: {
    sky: 0x9cc4ea,
    fog: 0xdbe7f0,
    ground: 0x4f7a3a,
    road: 0x4b4b4b,
    sun: 40,
    wet: false,
    haze: false,
  },
  // Sunrise over the Atlantic: the sun low ahead, just right of the drive, a peach haze down it.
  southbeach: {
    sky: 0xf6b88a,
    fog: 0xf3c9a6,
    ground: 0xe6d3ad,
    road: 0x5d5e66,
    sun: 7,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.8,
    azimuth: 18,
    light: { sun: 3.2, fill: 1.15, colour: 0xffc796 },
    fogRange: [120, 1100],
  },
  // A clear midsummer afternoon over Lake Ontario, the sun behind the rider's left shoulder.
  // Dusk over the Thames: the sun low behind the rider, the sky rose and violet, the road wet.
  westminster: {
    sky: 0xb48aa0,
    fog: 0x8f8597,
    ground: 0x3a3a44,
    road: 0x3c3d42,
    sun: 3,
    wet: true,
    haze: false,
    turbidity: 6,
    rayleigh: 3,
    azimuth: -155,
    light: { sun: 2.6, fill: 1.25, colour: 0xffb27a },
    fogRange: [70, 1100],
  },
  // An early summer morning in the park: the sun low behind the rider, a soft haze over Midtown.
  centralpark: {
    sky: 0x9cc8ea,
    fog: 0xc9d6df,
    ground: 0x4e8a3a,
    road: 0x4a4c51,
    sun: 16,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.8,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.0, colour: 0xffe7c4 },
    fogRange: [70, 1000],
  },
  // Indoors under the floodlights: a high warm key from the roof, the far end lost in the haze.
  ghent: {
    sky: 0x1c1a19,
    fog: 0x2b2622,
    ground: 0x3b3f45,
    road: 0xc9a06a,
    sun: 72,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 0.5,
    azimuth: -160,
    light: { sun: 2.4, fill: 1.3, colour: 0xfff0d8 },
    fogRange: [30, 240],
  },
  // Dusk on the Golden Mile: the last light low behind the rider, the illuminations switched on.
  blackpool: {
    sky: 0x2d2c5c,
    fog: 0x3b3766,
    ground: 0x8f7b62,
    road: 0x4c4d55,
    sun: 8,
    wet: false,
    haze: false,
    turbidity: 8,
    rayleigh: 3.5,
    azimuth: -150,
    light: { sun: 2.2, fill: 2.0, colour: 0xffa878 },
    fogRange: [80, 1400],
  },
  // Dawn over the suburb: the sun just up behind the rider, a pink-gold sky, long shadows.
  suburbia: {
    sky: 0xf2c9b0,
    fog: 0xecd8cc,
    ground: 0x5a9440,
    road: 0x55565c,
    sun: 7,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 2.4,
    azimuth: -150,
    light: { sun: 3.0, fill: 1.2, colour: 0xffc89a },
    fogRange: [70, 1100],
  },
  // A warm August bank holiday afternoon in west London: high sun behind the rider, light haze.
  nottinghill: {
    sky: 0x9fc4e4,
    fog: 0xcdd6dd,
    ground: 0x8a867e,
    road: 0x45464b,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 1.6,
    azimuth: -140,
    light: { sun: 3.2, fill: 1.0, colour: 0xfff0dc },
    fogRange: [70, 1100],
  }, // Late morning in lower Manhattan: a high sun behind the rider lights the towers' upper floors
  // while the canyon floor sits in their shade, the sky a clean blue over the ticker tape.
  knicks: {
    sky: 0x8fbbe6,
    fog: 0xbfcbd6,
    ground: 0x8d8d8f,
    road: 0x45464b,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 2.5,
    rayleigh: 1.6,
    azimuth: -160,
    light: { sun: 3.0, fill: 1.25, colour: 0xfff1dc },
    fogRange: [160, 1500],
  },
  // The Strip after midnight: a desert night sky over the glow, the neon doing the lighting.
  vegas: {
    sky: 0x0a0b22,
    fog: 0x261a3a,
    ground: 0x23222b,
    road: 0x3a3b44,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 40,
      azimuth: -150,
      strength: 1.2,
      colour: 0xc8b8ff,
      fill: 2.4,
      fillSky: 0x7a5aa0,
    },
    fogRange: [60, 1500],
  },
  // A golden afternoon in the high desert: the sun behind the rider, a clear deep sky, warm haze far off.
  route66: {
    sky: 0x6fa8dc,
    fog: 0xe6c7a2,
    ground: 0xb9744a,
    road: 0x5a5651,
    sun: 24,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.3,
    azimuth: -140,
    light: { sun: 3.4, fill: 1.0, colour: 0xffe2b8 },
    fogRange: [150, 2600],
  },
  // Golden hour on the Santa Monica Bay: the sun low over the ocean on the rider's left throws
  // long shadows across the path, and a warm marine haze gilds the pier and the mountains ahead
  // under a sky still blue overhead.
  venice: {
    sky: 0x7fb0d8,
    fog: 0xe8d2b0,
    ground: 0xe3cfa5,
    road: 0x55565b,
    sun: 9,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.3,
    azimuth: -72,
    light: { sun: 3.4, fill: 1.0, colour: 0xffc98c },
    fogRange: [110, 1300],
  },
  // A spring morning on the Herengracht: soft sun behind the rider, a light haze over the water.
  amsterdam: {
    sky: 0x9ec4e6,
    fog: 0xd6dde3,
    ground: 0x3d4a3e,
    road: 0x6b4a3a,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 2,
    azimuth: -145,
    light: { sun: 3.0, fill: 1.1, colour: 0xfff1dc },
    fogRange: [60, 900],
  },
  // Sunrise on the Giza plateau: a low gold sun behind the rider, warm dust in the air.
  giza: {
    sky: 0xf0c890,
    fog: 0xe8c49a,
    ground: 0xd9a86a,
    road: 0x7a6e66,
    sun: 9,
    wet: false,
    haze: true,
    turbidity: 9,
    rayleigh: 2.4,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.2, colour: 0xffc890 },
    fogRange: [120, 2600],
  },
  // A bright Florida morning on the beach: high sun behind the rider, sea haze on the horizon.
  daytona: {
    sky: 0x8ec8ee,
    fog: 0xcfe2ee,
    ground: 0xe0c9a0,
    road: 0xc9a878,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -145,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [80, 1400],
  },
  // A misty spring morning in the Flemish Ardennes: a pale sun high behind the mist, the cobbles
  // wet and slick, the fields fading into grey-green a few hundred metres off.
  koppenberg: {
    sky: 0xb9c4c6,
    fog: 0xc9cec4,
    ground: 0x5f8a3e,
    road: 0x6d6a66,
    sun: 22,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1.2,
    azimuth: -130,
    light: { sun: 2.2, fill: 1.5, colour: 0xf2f0e6 },
    fogRange: [35, 520],
  },
  // A clear, windswept noon high on the Ventoux: hard light behind the rider, a pale sky scoured by the mistral.
  ventoux: {
    sky: 0x7fb2e6,
    fog: 0xc9d6e2,
    ground: 0x8a9aa8,
    road: 0x55565c,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.1, colour: 0xfffaf0 },
    fogRange: [150, 3200],
  },
  // A bright late-summer afternoon in the Loop: the sun behind the rider, light slanting under the L.
  chicago: {
    sky: 0x8fbfe8,
    fog: 0xc8d4de,
    ground: 0x6a6a6a,
    road: 0x4a4b52,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 3.0, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [80, 900],
  },
  // A foggy summer morning in Golden Gate Park: the marine layer rolling in off the Pacific, the
  // sun a pale glow high behind it, soft light under the eucalyptus and the windmill grey ahead.
  goldengate: {
    sky: 0xb4bec6,
    fog: 0xc5ccd2,
    ground: 0x5f8048,
    road: 0x4b4c50,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 8,
    rayleigh: 0.8,
    azimuth: -100,
    light: { sun: 1.5, fill: 1.9, colour: 0xeef0ee },
    fogRange: [20, 380],
  },
  // Late afternoon on the Malecón: a warm sun behind the rider, salt haze over the Gulf.
  havana: {
    sky: 0x8cc4ec,
    fog: 0xd8e2e6,
    ground: 0x1f6a96,
    road: 0x5d5e66,
    sun: 24,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.8,
    azimuth: -140,
    light: { sun: 3.1, fill: 1.2, colour: 0xffe8c8 },
    fogRange: [90, 1800],
  },
  // A clear Cape morning: the sun behind the rider, the Atlantic glittering, the mountain sharp.
  seapoint: {
    sky: 0x7fb8ea,
    fog: 0xd2e0ea,
    ground: 0x1e5a78,
    road: 0x8a7a64,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: -145,
    light: { sun: 3.1, fill: 1.2, colour: 0xfff6e8 },
    fogRange: [150, 5000],
  },
  // A summer evening in the Quartier des Spectacles: the sun just down behind the rider, the sky violet, the festival lit.
  montreal: {
    sky: 0x6a5a9a,
    fog: 0x4a4068,
    ground: 0x55555a,
    road: 0x5e5f68,
    sun: 7,
    wet: false,
    haze: true,
    turbidity: 6,
    rayleigh: 2.6,
    azimuth: -150,
    light: { sun: 1.8, fill: 1.4, colour: 0xffb88a },
    fogRange: [60, 700],
  },
  // A clear Vancouver morning on the seawall: low sun over the park, a blue sky, the bay bright
  // and the North Shore mountains soft in the distance.
  stanleypark: {
    sky: 0x86b9e6,
    fog: 0xcfdde8,
    ground: 0x3e5a34,
    road: 0x55565a,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.8,
    rayleigh: 1.4,
    azimuth: 120,
    light: { sun: 2.8, fill: 1.2, colour: 0xfff4e4 },
    fogRange: [180, 5000],
  },
  // A crisp alpine morning: the sun behind the rider, deep blue sky over the snowfields.
  stelvio: {
    sky: 0x6aa8e6,
    fog: 0xc8d8e8,
    ground: 0x7a9a68,
    road: 0x55565c,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.2, colour: 0xfffaf0 },
    fogRange: [200, 3600],
  },
  // A bright August afternoon in Edinburgh: broken cloud, the sun behind the rider, the stone dark.
  edinburgh: {
    sky: 0x8ab4dc,
    fog: 0xc8d0d8,
    ground: 0x6a6a6e,
    road: 0x5a5a60,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3.5,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 2.9, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [80, 900],
  },
  // A bright winter morning on Oahu's North Shore: deep blue sky, trade-wind haze, the sun high.
  northshore: {
    sky: 0x5aa0e8,
    fog: 0xbcd8e8,
    ground: 0x6a8a3a,
    road: 0x5a5a5e,
    sun: 46,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.8,
    azimuth: -140,
    light: { sun: 3, fill: 1.4, colour: 0xfff6e4 },
    fogRange: [400, 3200],
  },
  // A clear summer morning in Alta Badia: deep blue sky, the forest dark, the Dolomites pale.
  campolongo: {
    sky: 0x5a9ae0,
    fog: 0xc0d4e4,
    ground: 0x3a5a34,
    road: 0x55565c,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 3, fill: 1.4, colour: 0xfff6ea },
    fogRange: [250, 3200],
  },
  // A warm Singapore night: the sky deep indigo over the city's glow, the bay black and lit.
  marinabay: {
    sky: 0x0c1030,
    fog: 0x1a1a3a,
    ground: 0x10141c,
    road: 0x3a3b44,
    sun: -8,
    wet: false,
    haze: false,
    moon: {
      elevation: 35,
      azimuth: -150,
      strength: 1.1,
      colour: 0xc8d0ff,
      fill: 2.4,
      fillSky: 0x5a5aa0,
    },
    fogRange: [200, 2600],
  },
  // An early summer morning on the Serpentine: the sun low behind the rider's left shoulder over
  // Park Lane, raking warm light and long shadows across the lawns, mist on the lake, and
  // Kensington Gardens soft in the haze beyond the bridge.
  serpentine: {
    sky: 0x9ec4e8,
    fog: 0xe2ddd0,
    ground: 0x4f7a3a,
    road: 0x6a6a6c,
    sun: 16,
    wet: false,
    haze: false,
    turbidity: 3.6,
    rayleigh: 1.8,
    azimuth: -128,
    light: { sun: 3.0, fill: 1.0, colour: 0xffd9a8 },
    fogRange: [120, 1500],
  },
  // A golden summer evening in Paris: warm low sun behind the riders, the stone glowing.
  champs: {
    sky: 0x7aa8d8,
    fog: 0xe0d4c0,
    ground: 0xb8b0a2,
    road: 0x6a645c,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.4,
    azimuth: -170,
    light: { sun: 3, fill: 1.3, colour: 0xffe4c0 },
    fogRange: [300, 3200],
  },
  // A bright April morning over the polder: big sky, scattered cloud, the colours vivid.
  tulips: {
    sky: 0x6aa8e8,
    fog: 0xd0dce8,
    ground: 0x5a8a3a,
    road: 0x8a4a3a,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -140,
    light: { sun: 3, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [300, 3200],
  },
  // A bright Pyrenean summer afternoon: deep sky, the pasture vivid, the high rock pale.
  tourmalet: {
    sky: 0x5a9ae0,
    fog: 0xc4d4e4,
    ground: 0x5a8a3a,
    road: 0x4f5058,
    sun: 44,
    wet: false,
    haze: false,
    turbidity: 2.8,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 3, fill: 1.4, colour: 0xfff6ea },
    fogRange: [250, 3200],
  },
  // A warm Californian afternoon in the Napa Valley, the sun lower now behind the rider's left
  // shoulder: golden light raking across the vine rows with long shadows, and a dusty warm haze
  // laying the hills and the ridges back in layers.
  napa: {
    sky: 0x8cbce8,
    fog: 0xead8b4,
    ground: 0xb59a5a,
    road: 0x5c5c5e,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 5.2,
    rayleigh: 1.3,
    azimuth: -122,
    light: { sun: 3.3, fill: 1.05, colour: 0xffd49c },
    fogRange: [180, 2300],
  },
  // A warm June evening on Worthy Farm: the sun low and golden, a soft haze over the fields.
  glastonbury: {
    sky: 0x7ab0e0,
    fog: 0xe0d8c8,
    ground: 0x5a8a3a,
    road: 0x7a7e84,
    sun: 18,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.5,
    azimuth: -160,
    light: { sun: 2.8, fill: 1.4, colour: 0xffe4b8 },
    fogRange: [250, 2800],
  },
  // Sunrise over Elliott Bay: the sun just up, pink and gold light, cold blue shadows.
  pikeplace: {
    sky: 0x9ab0d0,
    fog: 0xe8c8c0,
    ground: 0x3a5a3a,
    road: 0x6a5a50,
    sun: 7,
    wet: true,
    haze: false,
    turbidity: 5,
    rayleigh: 2.4,
    azimuth: 70,
    light: { sun: 2.4, fill: 1.3, colour: 0xffc8a0 },
    fogRange: [300, 3600],
  },
  // A grey, blustery Lake District day: flat light under low cloud, the fells muted and damp.
  hardknott: {
    sky: 0x9aa8b4,
    fog: 0xb8c0c4,
    ground: 0x5a6a3a,
    road: 0x55565a,
    sun: 30,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 0.8,
    azimuth: -130,
    light: { sun: 1.6, fill: 1.8, colour: 0xeef0f2 },
    fogRange: [400, 4200],
  },
  // A blazing July afternoon on the Alpe: the clear, thin air of altitude scatters little, so the
  // sky stays a deep blue down to the peaks; the sun high and a little behind the rider's left
  // shoulder, sharp shadows.
  alpe: {
    sky: 0x5f9fe0,
    fog: 0xc9d8ea,
    ground: 0x5a8a3a,
    road: 0x4e4f54,
    sun: 48,
    wet: false,
    haze: false,
    turbidity: 1.1,
    rayleigh: 0.7,
    azimuth: -140,
    light: { sun: 3.3, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [260, 4200],
  },
  // Sunrise in the Sonoran desert: the sun just up, long shadows, the sky pink to clear blue.
  saguaro: {
    sky: 0x8ab0e0,
    fog: 0xf0c8b0,
    ground: 0xc8a07a,
    road: 0x505058,
    sun: 9,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 2.2,
    azimuth: -110,
    light: { sun: 3, fill: 1.2, colour: 0xffc890 },
    fogRange: [400, 4200],
  },
  // A cool, bright Romsdal summer morning: clear northern light, crisp shadows, mist on the ledges.
  trollstigen: {
    sky: 0x7aa8d8,
    fog: 0xd0dce4,
    ground: 0x4a7a3a,
    road: 0x4f5054,
    sun: 34,
    wet: true,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.4,
    azimuth: 150,
    light: { sun: 2.6, fill: 1.5, colour: 0xf4f6ff },
    fogRange: [400, 3800],
  },
  // A bright Riviera spring afternoon: deep blue sky and sea, warm light on the terraces.
  poggio: {
    sky: 0x5a9ae8,
    fog: 0xd0e0ec,
    ground: 0x6a8a4a,
    road: 0x555860,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.4,
    azimuth: -120,
    light: { sun: 3, fill: 1.4, colour: 0xfff4e0 },
    fogRange: [400, 4400],
  },
  // A golden Parisian afternoon on the butte: the sun sinking in the west, its warm light raking
  // down the street onto the fronts on the left while the right stays in shade, a shadow line
  // across the cobbles, and a soft golden haze over the rooftops.
  montmartre: {
    sky: 0x8ab8e0,
    fog: 0xecd6b0,
    ground: 0x8a8478,
    road: 0x6a6660,
    sun: 32,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 1.2,
    azimuth: 40,
    light: { sun: 4.2, fill: 1.0, colour: 0xffc380 },
    fogRange: [200, 2600],
  },
  // Race day in May: a hot, clear blue sky and hard midday light over the oval.
  brickyard: {
    sky: 0x4a8ae0,
    fog: 0xd4e0ec,
    ground: 0x4a8a3a,
    road: 0x45474c,
    sun: 58,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.3,
    azimuth: -140,
    light: { sun: 3.2, fill: 1.4, colour: 0xfffaf0 },
    fogRange: [400, 4000],
  },
  // A hot, golden Yucatán afternoon: high humid haze, warm light on the white stone.
  chichen: {
    sky: 0x6aa0d8,
    fog: 0xd8e0c8,
    ground: 0x3a6a2a,
    road: 0xc8bea8,
    sun: 36,
    wet: false,
    haze: false,
    turbidity: 5,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 2.9, fill: 1.5, colour: 0xffeccc },
    fogRange: [300, 3200],
  },
  // A blazing summer morning on the salt: a deep blue sky paling to white at the horizon, the sun
  // high, hard shadows on the dazzling white, and the far ranges blue-grey in the heat.
  bonneville: {
    sky: 0x6aa6e0,
    fog: 0xdfe8f2,
    ground: 0xeeece4,
    road: 0xe2e0d8,
    sun: 52,
    wet: false,
    haze: false,
    turbidity: 1.2,
    rayleigh: 0.8,
    azimuth: 40,
    light: { sun: 3, fill: 0.9, colour: 0xfff6e8 },
    fogRange: [400, 5200],
  },
  // A clear early-summer morning on the lake: soft bright light, a faint haze over the water.
  como: {
    sky: 0x7ab0e0,
    fog: 0xd4e2e8,
    ground: 0x3a6a3a,
    road: 0x4f5156,
    sun: 32,
    wet: false,
    haze: false,
    turbidity: 3.2,
    rayleigh: 1.5,
    azimuth: 120,
    light: { sun: 2.7, fill: 1.5, colour: 0xfff6e8 },
    fogRange: [400, 4200],
  },
  // A bright late-spring morning on the valley floor: clean mountain air, sun on the granite.
  yosemite: {
    sky: 0x6aa8e8,
    fog: 0xd0dce8,
    ground: 0x5a7a34,
    road: 0x4a4c50,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.4,
    azimuth: 150,
    light: { sun: 2.9, fill: 1.5, colour: 0xfff4e4 },
    fogRange: [600, 6000],
  },
  // A clear, windy afternoon high on the volcano: thin bright air, hard light on the black rock.
  etna: {
    sky: 0x5a96d8,
    fog: 0xc8d4e0,
    ground: 0x2e2c2c,
    road: 0x3e4044,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.3,
    azimuth: -140,
    light: { sun: 3.0, fill: 1.6, colour: 0xfff2e0 },
    fogRange: [800, 9000],
  },
  // New Year's Eve in Times Square: a night sky over the glow, the screens doing the lighting.
  timessquare: {
    sky: 0x0b0a20,
    fog: 0x1a1430,
    ground: 0x2a2a30,
    road: 0x34353c,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 40,
      azimuth: -150,
      strength: 1.0,
      colour: 0xc8c0ff,
      fill: 2.6,
      fillSky: 0x8a6ab0,
    },
    fogRange: [60, 1400],
  },
  // A bright, cool summer morning high in the Alps: clear air, crisp light on granite and grass.
  tremola: {
    sky: 0x5a98e0,
    fog: 0xd0dce8,
    ground: 0x5a7a34,
    road: 0x7a7670,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.3,
    azimuth: 140,
    light: { sun: 2.9, fill: 1.6, colour: 0xfff6ea },
    fogRange: [700, 8000],
  },
  // A cloudless morning high above the sea of clouds: thin air, a deep blue sky, hard bright light.
  teide: {
    sky: 0x3a7ad8,
    fog: 0xd8e4f0,
    ground: 0x5a4a3e,
    road: 0x3e4044,
    sun: 46,
    wet: false,
    haze: false,
    turbidity: 1.8,
    rayleigh: 1.1,
    azimuth: 130,
    light: { sun: 3.1, fill: 1.6, colour: 0xfff4e4 },
    fogRange: [1200, 14000],
  },
  // Race weekend on the Riviera: a clear deep blue sky, the sun high behind the rider over the
  // harbour so the yachts shine white, the sea glittering and the far mountains blue-grey in the
  // heat haze.
  monaco: {
    sky: 0x5a9ad8,
    fog: 0xc8dcea,
    ground: 0xb8b0a0,
    road: 0x45464c,
    sun: 48,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.2,
    azimuth: 150,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff2dc },
    fogRange: [300, 2400],
  },
  // A breezy summer evening over the field: a high, wide sky and low warm light across the grass.
  tempelhof: {
    sky: 0x5a9ae0,
    fog: 0xd8e0e8,
    ground: 0x8a9a4a,
    road: 0x9a9890,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -110,
    light: { sun: 2.7, fill: 1.5, colour: 0xffe8c8 },
    fogRange: [600, 6000],
  },
  // A bright, wild Patagonian afternoon: clean cold air, hard light, the wind off the ice.
  paine: {
    sky: 0x4a8ad8,
    fog: 0xd8e4ec,
    ground: 0xb89a58,
    road: 0x8a7e6e,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.3,
    azimuth: -130,
    light: { sun: 3.0, fill: 1.6, colour: 0xfff4e4 },
    fogRange: [2500, 22000],
  },
  // A soft, grey Hebridean morning with the mist down: flat pale light, the road wet and shining.
  skye: {
    sky: 0xa8b0b8,
    fog: 0xc4cacf,
    ground: 0x6a6a3e,
    road: 0x3a3c40,
    sun: 24,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 0.6,
    azimuth: 160,
    light: { sun: 1.6, fill: 2.0, colour: 0xe8ecf0 },
    fogRange: [60, 1300],
  },
  caribana: {
    sky: 0x8ec5ee,
    fog: 0xcfe0ee,
    ground: 0x4f8a3a,
    road: 0x55575c,
    sun: 48,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.4,
    azimuth: -140,
    light: { sun: 3.4, fill: 0.9, colour: 0xfff1d8 },
    fogRange: [80, 900],
  },
  coast: {
    sky: 0xf29b6b,
    fog: 0xf6c39a,
    ground: 0x6f7d4a,
    road: 0x4a4646,
    sun: 3,
    wet: true,
    haze: true,
  },
};

/**
 * A colour flowing through the pass chain. TSL's node typings do not compose from one pass to
 * the next (a texture node, a join, an operator), so the chain carries them as one vec4 type.
 */
type ColorNode = ReturnType<typeof vec4>;

/** How far each panorama turns, as a share of its width, to put its landmark down the road. */
const PANORAMA_TURN: Partial<Record<WorldId, number>> = { oldtown: -0.12 };

/** Anisotropic filtering per tier (technique 8). */
const ANISOTROPY: Record<Tier, number> = { low: 4, medium: 8, high: 16, ultra: 16 };

/** 2 m steps ahead of the rider, and behind for the camera. */
const AHEAD = 150;
const BEHIND = 10;
const STEP = 2;
const ROAD_HALF = 3.5;
const GROUND_HALF = 400;
const DASH = 10;
/** Street lamps and reflective posts repeat along the road (techniques 23, 24). */
const LAMP_EVERY = 40;
const LAMPS = 6;
const POST_EVERY = 20;
const POSTS = 14;
/** How far the gradient under the rider eases towards the target each frame. */
const FRAME_EASE = 0.02;

export class ThreeWorldRenderer implements WorldRenderer {
  private renderer: WebGPURenderer | null = null;
  private pipeline: RenderPipeline | null = null;
  private backend: Backend = 'webgl2';
  private budget: FrameBudget | null = null;
  private on = new Set<number>();
  private reducedMotion = false;
  private lastFrameAt: number | null = null;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, 16 / 9, 0.1, 6000);
  private readonly sun = new DirectionalLight(0xffffff, 1.4);
  private readonly sky = new SkyMesh();
  private readonly road = stripGeometry();
  private readonly ground = stripGeometry();
  private readonly roadMaterial = new MeshStandardMaterial({ roughness: 0.9 });
  private readonly frameMaterial = new MeshPhysicalMaterial({
    color: 0x15171c,
    metalness: 0.6,
    roughness: 0.35,
  });
  /** Every bike's frame paint, given a clearcoat together at the tier that has one. */
  private readonly frames: MeshPhysicalMaterial[] = [this.frameMaterial];
  private readonly arch = new Group();
  private you: Cyclist | null = null;
  private readonly pacers = new Map<number, Cyclist>();
  private readonly wheelBlur: Mesh[] = [];
  private readonly lamps: PointLight[] = [];
  private street: OldTownStreet | null = null;
  private towers: DocklandsStreet | null = null;
  /** The street of a scene built on the shared kit (world-streets.ts). */
  private scenery: SceneStreet | null = null;
  private readonly posts: Mesh[] = [];
  private readonly textures: Texture[] = [];
  private readonly disposables: { dispose(): void }[] = [];
  private plainRoad: CanvasTexture | null = null;
  private layeredRoad: CanvasTexture | null = null;
  private roadRelief: CanvasTexture | null = null;
  private archLabel: { text: string; texture: CanvasTexture; mesh: Mesh } | null = null;
  private world: World | null = null;
  private look: Look = LOOKS.oldtown;
  private grade = 0;

  async start(canvas: HTMLCanvasElement, world: World): Promise<boolean> {
    try {
      const renderer = new WebGPURenderer({ canvas, antialias: false });
      await renderer.init();
      this.renderer = renderer;
      this.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
    } catch {
      return false;
    }
    this.world = world;
    this.look = LOOKS[world.id];
    this.grade = world.grade.warmup;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.budget = new FrameBudget(startTier(this.backend));

    this.buildScene(world, canvas);
    // Docklands' photographed distance is the mock's own still, riders and all: its towers are
    // built in 3D instead.
    // A kit-built street draws its own distance in 3D, as Docklands' towers do.
    const street = STREETS[world.id];
    if (world.id !== 'docklands' && !street) await this.addPanorama(world);
    if (street) this.addScenery(street);
    if (world.id === 'oldtown') this.addStreet();
    if (world.id === 'docklands') this.addTowers();
    this.applyTier();
    return true;
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (!this.renderer || width === 0 || height === 0) return;
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  draw(frame: SceneFrame): void {
    const world = this.world;
    if (!this.renderer || !world) return;
    this.feedBudget();
    if (frame.reducedMotion !== this.reducedMotion) {
      this.reducedMotion = frame.reducedMotion;
      this.applyTier();
    }

    const speed = frame.speedKmh / 3.6;
    const here = frame.segments.find(
      (s) => frame.elapsed >= s.start && frame.elapsed < s.start + s.duration,
    );
    if (here) this.grade += FRAME_EASE * (targetGrade(world, here.kind, frame.s) - this.grade);
    const ahead = roadAhead(
      world,
      frame.segments,
      { t: frame.elapsed, s: frame.s, speed, grade: this.grade },
      AHEAD,
    );
    if (this.towers) {
      // The road over an effort is a bridge ramp, laid at the same speed as the road ahead.
      const v = Math.max(speed, MIN_SPEED);
      const efforts = frame.segments.filter((g) => g.kind === 'work');
      this.towers.setTime(frame.reducedMotion ? 0 : frame.elapsed, frame.reducedMotion);
      this.towers.setBridge(
        (metres) => {
          const t = frame.elapsed + metres / v;
          return efforts.some((g) => t >= g.start && t < g.start + g.duration);
        },
        efforts.map((g) => (g.start - frame.elapsed) * v),
      );
    }
    this.scenery?.setTime(frame.reducedMotion ? 0 : frame.elapsed);
    this.layRoad(ahead, frame.s);
    const texture = this.roadMaterial.map;
    if (texture) texture.offset.y = (frame.s / DASH) % 1;
    if (this.roadRelief) this.roadRelief.offset.y = (frame.s / DASH) % 1;
    this.placeArch(world, frame, speed, ahead);
    this.placeRoadside(frame.s, ahead);
    this.placePacers(frame, ahead);

    this.you?.pose(frame.reducedMotion ? 0 : frame.crank);
    const blur = this.on.has(34) ? Math.min(0.55, speed / 14) : 0;
    for (const disc of this.wheelBlur) {
      disc.visible = blur > 0.02;
      (disc.material as MeshBasicMaterial).opacity = blur;
    }
    const sway = frame.reducedMotion ? 0 : Math.sin(frame.s / 3) * 0.04;
    this.camera.position.set(sway, 2.1, 5.5);
    this.camera.lookAt(0, 1.2 + heightAt(ahead, 24), -24);

    if (this.pipeline) this.pipeline.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    for (const t of this.textures) t.dispose();
    this.archLabel?.texture.dispose();
    this.pipeline?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }

  /** Feeds the frame budget while frames run back to back, and lowers the tier on a drop. */
  private feedBudget(): void {
    const now = performance.now();
    const last = this.lastFrameAt;
    this.lastFrameAt = now;
    if (last === null || now - last > 1000 || !this.budget) return;
    if (this.budget.sample(now, now - last) === 'drop') this.applyTier();
  }

  /** Turns the tier's techniques on and off, and rebuilds the pass chain (L2-111 AC2, AC5). */
  private applyTier(): void {
    const renderer = this.renderer;
    if (!renderer || !this.budget) return;
    const tier = this.budget.tier;
    const on = techniquesAt(tier, this.backend, this.reducedMotion);
    this.on = on;
    const look = this.look;

    renderer.toneMapping = on.has(17) ? AgXToneMapping : NoToneMapping;
    // The physical sky is bright HDR: expose for it, as a camera would.
    renderer.toneMappingExposure = on.has(11) ? 0.5 : 1;
    const anisotropy = on.has(8) ? ANISOTROPY[tier] : 1;
    for (const t of this.textures) {
      t.anisotropy = anisotropy;
      t.needsUpdate = true;
    }

    // Docklands draws its own night sky (world-docklands.ts); the physical sky is black at night.
    this.sky.visible = on.has(11) && this.world?.id !== 'docklands';
    this.scene.background = on.has(11) ? null : new Color(look.sky);

    renderer.shadowMap.enabled = on.has(12);
    // The WebGPU renderer has no PCFSoftShadowMap: soft shadows (37) widen the PCF filter instead.
    renderer.shadowMap.type = PCFShadowMap;
    this.sun.shadow.radius = on.has(37) ? 4 : 1;
    for (const rider of [this.you, ...this.pacers.values()]) {
      if (rider) rider.contact.visible = on.has(37);
    }
    this.sun.castShadow = on.has(12);

    this.roadMaterial.map = on.has(9) ? this.layeredRoad : this.plainRoad;
    // The setts' relief comes with the photometric-stereo materials (technique 3).
    this.roadMaterial.normalMap = on.has(3) ? this.roadRelief : null;
    const wet = on.has(14) && look.wet;
    this.roadMaterial.roughness = wet ? 0.28 : 0.9;
    this.roadMaterial.color.set(look.road).multiplyScalar(wet ? 0.7 : 1);
    this.wetSky(wet);
    this.roadMaterial.needsUpdate = true;

    for (const frame of this.frames) {
      frame.clearcoat = on.has(15) ? 1 : 0;
      frame.clearcoatRoughness = 0.08;
      frame.needsUpdate = true;
    }

    const night = look.sun < 0;
    for (const lamp of this.lamps) lamp.visible = on.has(23) && night;
    for (const post of this.posts) post.visible = on.has(24);

    this.scene.environment = null;
    if (on.has(6)) this.lightFromSky(renderer);

    this.pipeline?.dispose();
    this.pipeline = this.buildPipeline(renderer, on);
  }

  /** The post-processing chain of the tier, in the order of the design. */
  private buildPipeline(renderer: WebGPURenderer, on: Set<number>): RenderPipeline {
    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(this.scene, this.camera);
    const needsVelocity = on.has(7) || on.has(33);
    if (needsVelocity) scenePass.setMRT(mrt({ output, velocity }));
    const depth = scenePass.getTextureNode('depth');
    const beauty = scenePass.getTextureNode('output');

    // Heat haze shimmers just above the horizon (technique 50).
    let color: ColorNode = (on.has(50) && this.look.haze
      ? beauty.sample(
          screenUV.add(
            vec2(
              sin(time.mul(3).add(screenUV.y.mul(140)))
                .mul(0.0012)
                .mul(
                  smoothstep(float(0.38), float(0.5), screenUV.y).mul(
                    smoothstep(float(0.62), float(0.5), screenUV.y),
                  ),
                ),
              0,
            ),
          ),
        )
      : beauty) as unknown as ColorNode;

    if (on.has(36)) {
      // GTAO rebuilds normals from depth when given none; its typings omit the null it documents.
      const occlusion = ao(depth, null as unknown as Node, this.camera).getTextureNode().r;
      color = vec4(color.rgb.mul(occlusion), color.a);
    }
    if (on.has(33) && needsVelocity) {
      const moving = scenePass.getTextureNode('velocity');
      color = motionBlur(convertToTexture(color), moving.mul(0.5)) as unknown as ColorNode;
    }
    if (on.has(49)) color = color.add(bloom(color, 0.12, 0.2, 1.4)) as unknown as ColorNode;
    pipeline.outputNode = on.has(7)
      ? traa(color, depth, scenePass.getTextureNode('velocity'), this.camera)
      : fxaa(color);
    return pipeline;
  }

  /** Image-based lighting from the scene's sky (technique 6). */
  private lightFromSky(renderer: WebGPURenderer): void {
    try {
      const skyScene = new Scene();
      const sky = new SkyMesh();
      sky.scale.setScalar(1000);
      sky.sunPosition.value.copy(this.sunDirection());
      skyScene.add(sky);
      const pmrem = new PMREMGenerator(renderer);
      this.scene.environment = pmrem.fromScene(skyScene).texture;
      // The physical sky is HDR radiance: a small share of it lights the scene.
      this.scene.environmentIntensity = 0.06;
      pmrem.dispose();
    } catch {
      this.scene.environment = null;
    }
  }

  private sunDirection(): Vector3 {
    return direction(this.look.sun, this.look.azimuth ?? -27);
  }

  private buildScene(world: World, canvas: HTMLCanvasElement): void {
    const look = this.look;
    this.scene.fog = new Fog(look.fog, look.fogRange?.[0] ?? 60, look.fogRange?.[1] ?? 650);
    const moon = look.sun < 0 ? look.moon : undefined;
    this.scene.add(
      moon
        ? new HemisphereLight(moon.fillSky, look.ground, moon.fill)
        : new HemisphereLight(
            look.sky,
            look.ground,
            look.sun < 0 ? 0.5 : (look.light?.fill ?? 1.4),
          ),
    );

    // At night the key light is the moon, where the look has one; the sky keeps the sun.
    const sunDir = moon ? direction(moon.elevation, moon.azimuth) : this.sunDirection();
    this.sun.intensity = moon ? moon.strength : look.sun < 0 ? 0.15 : (look.light?.sun ?? 2.2);
    this.sun.color.set(moon?.colour ?? look.light?.colour ?? 0xffffff);
    // The shadow box reaches further down a street of houses than over open country.
    const reach = world.id === 'oldtown' ? 45 : 25;
    this.sun.target.position.set(0, 0, 25 - reach);
    this.sun.position.copy(sunDir).multiplyScalar(80).add(this.sun.target.position);
    this.sun.shadow.mapSize.set(2048, 2048);
    // A tight box around the rider: the shadow stays sharp and steady as the road moves.
    const cam = this.sun.shadow.camera;
    cam.left = -reach;
    cam.right = reach;
    cam.top = reach;
    cam.bottom = -reach;
    cam.near = 1;
    cam.far = 240;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun, this.sun.target);

    this.sky.scale.setScalar(4500);
    this.sky.turbidity.value = look.turbidity ?? 4;
    this.sky.rayleigh.value = look.sun < 0 ? 0.3 : (look.rayleigh ?? 1.6);
    this.sky.mieCoefficient.value = 0.003;
    this.sky.sunPosition.value.copy(this.sunDirection());
    this.scene.add(this.sky);

    this.plainRoad = this.track(roadTexture(false));
    const cobbles = COBBLED.has(world.id) ? cobbleTextures() : null;
    this.layeredRoad = this.track(cobbles?.map ?? roadTexture(true));
    this.roadRelief = cobbles ? this.track(cobbles.relief) : null;
    this.roadMaterial.color.set(look.road);
    const groundMesh = this.addMesh(
      this.ground,
      new MeshStandardMaterial({ color: look.ground, roughness: 1 }),
    );
    groundMesh.receiveShadow = true;
    const roadMesh = this.addMesh(this.road, this.roadMaterial);
    roadMesh.receiveShadow = true;
    this.addRider(canvas);
    this.addArch();
    this.addRoadside();
  }

  private track<T extends Texture>(texture: T): T {
    this.textures.push(texture);
    return texture;
  }

  private addMesh(geometry: BufferGeometry, material: Material): Mesh {
    const mesh = new Mesh(geometry, material);
    this.scene.add(mesh);
    this.disposables.push(geometry, material);
    return mesh;
  }

  /**
   * The photographed distance, on an arc far ahead that the fog does not reach. It is loaded
   * before the first frame: a ride that has not started draws only when its state changes.
   */
  private async addPanorama(world: World): Promise<void> {
    const arc = (2 * Math.PI) / 3;
    const geometry = new CylinderGeometry(900, 900, 560, 48, 1, true, Math.PI - arc / 2, arc);
    const material = new MeshBasicMaterial({ side: BackSide, fog: false, transparent: true });
    const mesh = this.addMesh(geometry, material);
    mesh.position.y = 160;
    try {
      const texture = await new TextureLoader().loadAsync(`/worlds/${world.id}/panorama.webp`);
      texture.colorSpace = SRGBColorSpace;
      texture.wrapS = RepeatWrapping;
      texture.repeat.x = -1;
      texture.offset.x = PANORAMA_TURN[world.id] ?? 0;
      material.map = this.track(texture);
      material.alphaMap = this.track(fadeTexture());
      material.needsUpdate = true;
    } catch {
      mesh.visible = false;
    }
  }

  /** The rider on their bike, from behind, in the You colour of the rider board. */
  private addRider(canvas: HTMLCanvasElement): void {
    const kit = new CyclistKit(this.frameMaterial);
    const you = kit.make(riderColour(canvas, 4), 4);
    this.you = you;
    this.wheelBlur.push(...you.wheelBlur);
    this.scene.add(you.group);
    this.disposables.push(kit, you.jersey, you.bib, you.shell, this.frameMaterial);
    // The simulated pacers ride with the rider, each in its board colour (L2-107 AC7).
    for (const pacer of PACERS) {
      // Each pacer rides a frame of their own paint.
      const frame = this.frameMaterial.clone();
      frame.color.set(FRAME_PAINT[pacer.jersey % FRAME_PAINT.length]!);
      this.frames.push(frame);
      this.disposables.push(frame);
      const rider = kit.make(riderColour(canvas, pacer.jersey), pacer.jersey, frame);
      // Half the pacers wear a white helmet rather than one in their colour.
      if (pacer.jersey % 2 === 0) rider.shell.color.set(0xf2f2ee);
      rider.group.visible = false;
      this.pacers.set(pacer.jersey, rider);
      this.scene.add(rider.group);
      this.disposables.push(rider.jersey, rider.bib, rider.shell);
    }
  }

  /** Puts each pacer in view at its gap, and hides the rest (L2-107 AC7). */
  private placePacers(frame: SceneFrame, ahead: RoadPoint[]): void {
    for (const rider of this.pacers.values()) rider.group.visible = false;
    for (const p of pacersOnRoad(frame.elapsed, AHEAD * STEP)) {
      const rider = this.pacers.get(p.jersey);
      if (!rider) continue;
      rider.group.visible = true;
      rider.group.position.set(p.lane, heightAt(ahead, p.metres), -p.metres);
      rider.pose(frame.reducedMotion ? 0 : frame.crank * (0.9 + p.jersey * 0.03) + p.jersey);
    }
  }

  /** The arch over the road ahead: two posts, a beam and its label. */
  private addArch(): void {
    const material = new MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.5 });
    const steel = new MeshStandardMaterial({ color: 0x8d939b, metalness: 0.7, roughness: 0.35 });
    // Each leg is a truss: four steel chords on a weighted foot.
    const chord = new BoxGeometry(0.06, 5.2, 0.06);
    const foot = new BoxGeometry(0.9, 0.25, 0.9);
    for (const x of [-ROAD_HALF - 0.7, ROAD_HALF + 0.7]) {
      for (const [dx, dz] of [
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ] as const) {
        const mesh = new Mesh(chord, steel);
        mesh.position.set(x + dx, 2.75, dz);
        mesh.castShadow = true;
        this.arch.add(mesh);
      }
      const base = new Mesh(foot, material);
      base.position.set(x, 0.125, 0);
      base.castShadow = true;
      this.arch.add(base);
    }
    const beam = new Mesh(new BoxGeometry(2 * ROAD_HALF + 2, 1.4, 0.45), material);
    beam.position.y = 5.6;
    beam.castShadow = true;
    this.arch.add(beam);
    // The line across the road where the effort starts.
    const line = new Mesh(
      new PlaneGeometry(2 * ROAD_HALF, 0.4),
      new MeshStandardMaterial({ color: 0xf2f3ef, roughness: 0.6 }),
    );
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0.02;
    line.receiveShadow = true;
    this.arch.add(line);
    this.disposables.push(
      material,
      steel,
      chord,
      foot,
      beam.geometry,
      line.geometry,
      line.material as Material,
    );
    this.arch.visible = false;
    this.scene.add(this.arch);
  }

  /** Street lamps for a night scene and reflective posts on both verges (techniques 23, 24). */
  private addRoadside(): void {
    for (let i = 0; i < LAMPS; i++) {
      const lamp = new PointLight(0xffc98a, 40, 45, 2);
      lamp.visible = false;
      this.lamps.push(lamp);
      this.scene.add(lamp);
    }
    const post = new BoxGeometry(0.12, 1, 0.12);
    const reflector = new MeshStandardMaterial({
      color: 0xf2f3ef,
      emissive: new Color(0xff5a2e),
      emissiveIntensity: this.look.sun < 0 ? 2.5 : 0.4,
      roughness: 0.4,
    });
    // Old Town's kerbs have iron bollards (world-oldtown.ts) and Docklands' quay a neon line
    // (world-docklands.ts) in place of verge posts.
    const id = this.world?.id;
    const posts = id === 'oldtown' || id === 'docklands' || (id && STREETS[id]) ? 0 : POSTS;
    for (let i = 0; i < posts; i++) {
      const mesh = new Mesh(post, reflector);
      mesh.visible = false;
      this.posts.push(mesh);
      this.scene.add(mesh);
    }
    this.disposables.push(post, reflector);
  }

  private addStreet(): void {
    const street = new OldTownStreet((t) => this.track(t), this.disposables);
    street.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(street.group);
    this.street = street;
  }

  private addScenery(make: StreetFactory): void {
    const street = make((t) => this.track(t), this.disposables);
    street.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(street.group);
    this.scenery = street;
  }

  private addTowers(): void {
    const towers = new DocklandsStreet((t) => this.track(t), this.disposables);
    towers.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(towers.group);
    this.towers = towers;
    this.wetSky(this.look.wet === true);
  }

  /** A wet Docklands road mirrors its night sky's violet glow, as the mock's road does. */
  private wetSky(wet: boolean): void {
    this.roadMaterial.envMap = wet && this.towers ? this.towers.skyEnv() : null;
    this.roadMaterial.envMapIntensity = 1.4;
    this.roadMaterial.needsUpdate = true;
  }

  private placeRoadside(s: number, ahead: RoadPoint[]): void {
    this.street?.place(s, (metres) => heightAt(ahead, metres));
    this.towers?.place(s, (metres) => heightAt(ahead, metres));
    this.scenery?.place(s, (metres) => heightAt(ahead, metres));
    this.lamps.forEach((lamp, i) => {
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + 8;
      lamp.position.set(
        i % 2 === 0 ? -ROAD_HALF - 1.5 : ROAD_HALF + 1.5,
        heightAt(ahead, metres) + 6,
        -metres,
      );
    });
    this.posts.forEach((post, i) => {
      const metres = Math.floor(i / 2) * POST_EVERY - (s % POST_EVERY) + 4;
      post.position.set(
        i % 2 === 0 ? -ROAD_HALF - 0.8 : ROAD_HALF + 0.8,
        heightAt(ahead, metres) + 0.5,
        -metres,
      );
    });
  }

  private placeArch(world: World, frame: SceneFrame, speed: number, ahead: RoadPoint[]): void {
    const arch = nextArch(world, frame.segments, frame.elapsed, speed);
    const far = AHEAD * STEP;
    this.arch.visible = arch !== null && arch.metres <= far;
    if (!arch || !this.arch.visible) return;
    this.arch.position.set(0, heightAt(ahead, arch.metres), -arch.metres);
    if (this.archLabel?.text === arch.label) return;
    if (this.archLabel) {
      this.arch.remove(this.archLabel.mesh);
      this.archLabel.texture.dispose();
      this.archLabel.mesh.geometry.dispose();
      (this.archLabel.mesh.material as Material).dispose();
    }
    const texture = labelTexture(arch.label);
    const mesh = new Mesh(
      new PlaneGeometry(2 * ROAD_HALF + 1.8, 1.2),
      new MeshBasicMaterial({ map: texture, side: DoubleSide }),
    );
    mesh.position.set(0, 5.6, 0.24);
    this.arch.add(mesh);
    this.archLabel = { text: arch.label, texture, mesh };
  }

  /** Lays the road and the ground beside it over the points ahead, and a short run behind. */
  private layRoad(ahead: RoadPoint[], s: number): void {
    const first = ahead[0]!;
    const behind: RoadPoint[] = [];
    for (let i = BEHIND; i >= 1; i--) {
      const metres = -i * STEP;
      behind.push({ metres, height: (first.grade / 100) * metres, grade: first.grade });
    }
    const points = [...behind, ...ahead];
    fillStrip(this.road, points, ROAD_HALF, 0);
    this.street?.lay(points, s);
    this.towers?.lay(points, s);
    this.scenery?.lay(points, s);
    fillStrip(this.ground, points, GROUND_HALF, -0.05);
    this.towers?.sink(this.ground, points);
    this.scenery?.sink?.(this.ground, points);
  }
}

/** A strip of quads along the road: two vertices per point. */
function stripGeometry(): BufferGeometry {
  const count = AHEAD + BEHIND + 1;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(count * 4), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const a = i * 2;
    // Wound counter-clockwise from above, so the strip faces up.
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setIndex(index);
  return geometry;
}

function fillStrip(
  geometry: BufferGeometry,
  points: RoadPoint[],
  half: number,
  drop: number,
): void {
  const position = geometry.getAttribute('position') as BufferAttribute;
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  points.forEach((p, i) => {
    position.setXYZ(i * 2, -half, p.height + drop, -p.metres);
    position.setXYZ(i * 2 + 1, half, p.height + drop, -p.metres);
    uv.setXY(i * 2, 0, p.metres / DASH);
    uv.setXY(i * 2 + 1, 1, p.metres / DASH);
  });
  position.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

/** A direction in the sky: azimuth 0 is straight down the road, positive to the rider's right. */
function direction(elevationDegrees: number, azimuthDegrees: number): Vector3 {
  const elevation = (elevationDegrees * Math.PI) / 180;
  const azimuth = (azimuthDegrees * Math.PI) / 180;
  const level = Math.cos(elevation);
  return new Vector3(
    Math.sin(azimuth) * level,
    Math.sin(elevation),
    -Math.cos(azimuth) * level,
  ).normalize();
}

function heightAt(points: RoadPoint[], metres: number): number {
  const i = Math.min(Math.max(Math.round(metres / STEP), 0), points.length - 1);
  return points[i]?.height ?? 0;
}

/**
 * The road surface, one 10 m tile with the dashed centre line and edge lines. Layered
 * (technique 9): aggregate speckle over the base, a tar seam and a worn wheel track.
 */
function roadTexture(layered: boolean): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    if (layered) {
      let seed = 7;
      const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9000; i++) {
        const shade = 200 + Math.floor(random() * 55);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
      }
      ctx.fillStyle = 'rgba(40,40,40,0.35)';
      ctx.fillRect(0, size * 0.62, size, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(size * 0.68, 0, size * 0.12, size);
    }
    ctx.fillStyle = '#f2f3ef';
    ctx.fillRect(size / 2 - 4, 0, 8, size * 0.56);
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(4, 0, 6, size);
    ctx.fillRect(size - 10, 0, 6, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Opaque below, fading out over the top fifth: the panorama's sky melts into the sky above. */
function fadeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#000');
    g.addColorStop(0.22, '#fff');
    g.addColorStop(1, '#fff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  return new CanvasTexture(canvas);
}

/** A rider colour of the design system, `--color-rider-<n>` (4 is You), read from the page. */
function riderColour(element: Element, n: number): Color {
  const value = getComputedStyle(element).getPropertyValue(`--color-rider-${n}`).trim();
  const colour = new Color(0xd7ff3a);
  if (value) colour.setStyle(value);
  return colour;
}

/** Frame paints for the pacers' bikes: white, red, navy, silver and teal. */
const FRAME_PAINT = [0xeeeeea, 0xb3262c, 0x1d2b4a, 0xa9aeb5, 0x2a7d7a];

function labelTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // As the mocks: dark lettering on the volt banner, inside a dark keyline.
    ctx.fillStyle = '#d8ff3e';
    ctx.fillRect(0, 0, 1024, 96);
    ctx.strokeStyle = '#1b1e24';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 1008, 80);
    ctx.fillStyle = '#1b1e24';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 512, 50);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
