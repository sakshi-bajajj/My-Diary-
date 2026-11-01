import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Reads "5:30 PM", "05:30 PM" or "17:30" into hours and minutes
function parseTime(time: string): { h: number; m: number } | null {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { h, m };
}

export type ReminderResult =
  | { status: 'ok'; id: string }
  | { status: 'no-permission' }
  | { status: 'no-time' }
  | { status: 'past' };

export async function scheduleReminder(
  title: string,
  date: string, // YYYY-MM-DD
  time: string
): Promise<ReminderResult> {
  const parsed = parseTime(time);
  if (!parsed) return { status: 'no-time' };

  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return { status: 'no-permission' };

  const [y, mo, d] = date.split('-').map(Number);
  const when = new Date(y, mo - 1, d, parsed.h, parsed.m, 0);
  if (when.getTime() <= Date.now()) return { status: 'past' };

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Reminder 🩵', body: title, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
  return { status: 'ok', id };
}

export async function cancelReminder(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.log('Failed to cancel reminder', e);
  }
}