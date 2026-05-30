/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CounterItem {
  id: string;
  name: string;
  value: number;
  step: number;
  target: number | null;
  minLimit: number | null;
  maxLimit: number | null;
  lastUpdated: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  counterId: string;
  counterName: string;
  valueBefore: number;
  valueAfter: number;
  change: number;
  timestamp: string;
}

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  soundType: 'sine' | 'square' | 'triangle';
  volumeKeyMode: 'all' | 'up_only' | 'down_only' | 'disabled';
  preventVolumeChange: boolean;
}
