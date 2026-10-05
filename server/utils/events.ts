/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'events';

export const kdsEvents = new EventEmitter();
kdsEvents.setMaxListeners(100); // Mencegah memory leak warning saat banyak tablet KDS / terminal terhubung
