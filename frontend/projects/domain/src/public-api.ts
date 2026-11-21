export { SIMULATED_BIKE, SimulatedBikeConnection } from './bluetooth/simulated-bike-connection';
export { bikeStatus } from './bluetooth/bike-status';
export { type BikeIdentity, bikeIdentity } from './bluetooth/bike-identity';
export { FtmsProtocol, type ResistanceRange } from './protocol/ftms-protocol';
export { GattWriteQueue } from './bluetooth/gatt-write-queue';
export { REMEMBERED_BIKE_KEY, RememberedBikeStore } from './storage/remembered-bike-store';
export { SUPPORTED_BIKES } from './bluetooth/supported-bikes';
export { SimulatedBluetoothSupport } from './bluetooth/simulated-bluetooth-support';
export { WebBluetoothSupport } from './bluetooth/web-bluetooth-support';
export { SimulatedRiderProfile } from './bluetooth/simulated-rider-profile';
export { WebBluetoothBikeConnection } from './bluetooth/web-bluetooth-bike-connection';
export { SecondTicker } from './engine/second-ticker';
export {
  EchelonProtocol,
  MAX_RESISTANCE,
  MIN_RESISTANCE,
  type WorkoutData,
  toHex,
} from './protocol/echelon-protocol';
