// The Echelon GATT identifiers.
export const ECHELON_UUIDS = {
  service: '0bf669f1-45f2-11e7-9598-0800200c9a66',
  writeCharacteristic: '0bf669f2-45f2-11e7-9598-0800200c9a66',
  notifyCharacteristic: '0bf669f4-45f2-11e7-9598-0800200c9a66',
  /** The first 8 hex digits of the service UUID, shown as `connection_id` (L2-014). */
  connectionId: '0bf669f1',
} as const;
