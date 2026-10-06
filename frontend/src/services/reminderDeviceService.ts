import { Platform } from 'react-native';
import type { Reminder } from './component04CrudService';

export type DeviceReminderStatus = 'scheduled' | 'denied' | 'unsupported' | 'disabled' | 'failed';
type Snapshot = { userId: string | null; reminders: Reminder[]; enabled: boolean };
const source = 'chorehub.personal-reminder';
let tail: Promise<unknown> = Promise.resolve();
let initialized = false;
const preferenceListeners = new Set<() => void>();
function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const result = tail.then(work, work); tail = result.catch(() => {}); return result;
}
function native() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  const notifications: typeof import('expo-notifications') = require('expo-notifications');
  if (!initialized) {
    notifications.setNotificationHandler({ handleNotification: async notification => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: notification.request.content.data?.alertSound !== false, shouldSetBadge: false,
    }) });
    initialized = true;
  }
  return notifications;
}
const channel = (sound: boolean, vibrate: boolean) => sound ? (vibrate ? 'personal-reminders-vibrate-v1' : 'personal-reminders-quiet-v1') : (vibrate ? 'personal-reminders-silent-vibrate-v1' : 'personal-reminders-silent-quiet-v1');
const identifier = (user: string, reminder: string) => `${source}:${user}:${reminder}`;

async function sync(snapshot: Snapshot, askPermission: boolean): Promise<DeviceReminderStatus> {
  const n = native(); if (!n) return 'unsupported';
  const pending = await n.getAllScheduledNotificationsAsync();
  const desired = new Map(snapshot.enabled && snapshot.userId ? snapshot.reminders
    .filter(r => r.status === 'pending' && Date.parse(r.remind_at) > Date.now())
    .map(r => [identifier(snapshot.userId!, r.id), r] as const) : []);
  // Only cancel this feature's schedules, including schedules belonging to a signed-out account.
  const own = pending.filter(p => p.content.data?.source === source);
  for (const p of own) if (!desired.has(p.identifier)) await n.cancelScheduledNotificationAsync(p.identifier);
  if (!snapshot.enabled || !snapshot.userId) return 'disabled';
  if (Platform.OS === 'android') {
    for (const sound of [true, false]) for (const vibrate of [true, false]) {
      await n.setNotificationChannelAsync(channel(sound, vibrate), {
        name: 'Personal reminders (' + (sound ? 'sound' : 'silent') + ', ' + (vibrate ? 'vibration' : 'no vibration') + ')',
        importance: n.AndroidImportance.HIGH, sound: sound ? 'default' : null,
        enableVibrate: vibrate, ...(vibrate ? { vibrationPattern: [0, 300, 200, 300] } : {}),
        lockscreenVisibility: n.AndroidNotificationVisibility.PRIVATE,
      });
    }
  }
  let permission = await n.getPermissionsAsync();
  if (!permission.granted && askPermission && permission.canAskAgain && permission.status === 'undetermined') {
    permission = await n.requestPermissionsAsync();
  }
  if (!permission.granted && permission.ios?.status !== n.IosAuthorizationStatus.PROVISIONAL) {
    for (const p of own) await n.cancelScheduledNotificationAsync(p.identifier);
    return 'denied';
  }
  for (const [id, r] of desired) {
    const body = [r.chore_name, r.chore_due_date ? new Date(r.chore_due_date).toLocaleString() : '', r.note].filter(Boolean).join('\n');
    const signature = JSON.stringify([r.title, body, r.remind_at, r.vibrate !== false, r.sound !== false]);
    if (own.some(p => p.identifier === id && p.content.data?.signature === signature)) continue;
    await n.cancelScheduledNotificationAsync(id);
    await n.scheduleNotificationAsync({ identifier: id,
      content: { title: r.title, body, sound: r.sound !== false ? 'default' : false, ...(r.vibrate !== false ? { vibrationPattern: [0, 300, 200, 300] } : {}),
        data: { source, signature, alertSound: r.sound !== false, userId: snapshot.userId, reminderId: r.id } },
      trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: new Date(r.remind_at),
        ...(Platform.OS === 'android' ? { channelId: channel(r.sound !== false, r.vibrate !== false) } : {}) },
    });
  }
  return 'scheduled';
}

export const reminderDeviceService = {
  subscribePreferences: (listener: () => void) => { preferenceListeners.add(listener); return () => { preferenceListeners.delete(listener); }; },
  preferencesChanged: () => { preferenceListeners.forEach(listener => listener()); },
  supported: () => Platform.OS === 'android' || Platform.OS === 'ios',
  reconcile: (load: () => Promise<Snapshot>) => exclusive(async () => sync(await load(), false)),
  clear: () => exclusive(async () => sync({ userId: null, reminders: [], enabled: false }, false)),
  // Hold the same queue as foreground reconciliation so it cannot restore an old schedule mid-edit.
  mutate: <T>(id: string | undefined, load: () => Promise<Snapshot>, mutation: () => Promise<T>, askPermission = true) => exclusive(async () => {
    let n: ReturnType<typeof native> = null;
    if (id) {
      n = native();
      if (n) for (const p of await n.getAllScheduledNotificationsAsync()) {
        if (p.content.data?.source === source && p.content.data?.reminderId === id) await n.cancelScheduledNotificationAsync(p.identifier);
      }
    }
    let result: T;
    try { result = await mutation(); }
    catch (error) { try { await sync(await load(), false); } catch {} throw error; }
    let device_status: DeviceReminderStatus;
    try { device_status = !reminderDeviceService.supported() ? 'unsupported' : await sync(await load(), askPermission); } catch { device_status = 'failed'; }
    return { ...result, device_status };
  }),
};
