/**
 * Availability engine for the salon booking system.
 * Takes a date and returns available time slots by checking:
 * 1. Weekly hours for that day of week
 * 2. Date overrides (closures or modified hours)
 * 3. Blocked times (recurring + one-off)
 * 4. Existing confirmed/pending appointments
 */

// Convert "HH:MM" to minutes since midnight
export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes since midnight to "HH:MM"
export function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Format "HH:MM" to "h:MM AM/PM"
export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Format date string to readable
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Check if a date is open (not closed by schedule or override)
 */
export function isDayOpen(dateStr, weeklyHours, dateOverrides) {
  // Check date override first
  const override = dateOverrides.find(o => o.date === dateStr);
  if (override) {
    if (override.closed) return false;
    return true; // has modified hours but is open
  }

  // Check weekly schedule
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  return weeklyHours[dow]?.open || false;
}

/**
 * Get operating hours for a specific date
 */
export function getHoursForDate(dateStr, weeklyHours, dateOverrides) {
  const override = dateOverrides.find(o => o.date === dateStr);
  if (override && !override.closed) {
    return { start: override.start, end: override.end };
  }

  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  const schedule = weeklyHours[dow];
  if (!schedule?.open) return null;
  return { start: schedule.start, end: schedule.end };
}

/**
 * Get all available time slots for a given date.
 * Returns array of "HH:MM" strings in 30-minute increments.
 */
export function getAvailableSlots(dateStr, weeklyHours, dateOverrides, blockedTimes, appointments, slotInterval = 30) {
  if (!isDayOpen(dateStr, weeklyHours, dateOverrides)) return [];

  const hours = getHoursForDate(dateStr, weeklyHours, dateOverrides);
  if (!hours) return [];

  const startMin = timeToMinutes(hours.start);
  const endMin = timeToMinutes(hours.end);
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();

  // Collect blocked intervals for this date
  const blocked = [];

  for (const bt of blockedTimes) {
    if (bt.recurring) {
      // Recurring daily or on specific day
      if (bt.day === null || bt.day === undefined || bt.day === dow) {
        blocked.push({ start: timeToMinutes(bt.start), end: timeToMinutes(bt.end) });
      }
    } else if (bt.date === dateStr) {
      blocked.push({ start: timeToMinutes(bt.start), end: timeToMinutes(bt.end) });
    }
  }

  // Collect booked intervals (confirmed + pending)
  const dayAppts = appointments.filter(a => a.date === dateStr && (a.status === 'confirmed' || a.status === 'pending'));
  for (const a of dayAppts) {
    const aStart = timeToMinutes(a.time);
    blocked.push({ start: aStart, end: aStart + a.duration });
  }

  // Generate slots
  const slots = [];
  for (let t = startMin; t < endMin; t += slotInterval) {
    // Check if this slot overlaps any blocked interval
    const slotEnd = t + slotInterval;
    const isBlocked = blocked.some(b => t < b.end && slotEnd > b.start);
    if (!isBlocked) {
      slots.push(minutesToTime(t));
    }
  }

  return slots;
}

/**
 * Check if a specific service can be booked at a given time on a given date.
 * Returns { ok: boolean, reason?: string }
 */
export function canBookService(dateStr, time, serviceDuration, weeklyHours, dateOverrides, blockedTimes, appointments) {
  const hours = getHoursForDate(dateStr, weeklyHours, dateOverrides);
  if (!hours) return { ok: false, reason: 'Salon is closed on this day.' };

  const serviceStart = timeToMinutes(time);
  const serviceEnd = serviceStart + serviceDuration;
  const closingTime = timeToMinutes(hours.end);

  if (serviceEnd > closingTime) {
    return { ok: false, reason: `This service runs ${serviceDuration} minutes and would extend past closing time (${formatTime(hours.end)}).` };
  }

  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();

  // Check blocked times
  for (const bt of blockedTimes) {
    let applies = false;
    if (bt.recurring && (bt.day === null || bt.day === undefined || bt.day === dow)) applies = true;
    if (!bt.recurring && bt.date === dateStr) applies = true;

    if (applies) {
      const bStart = timeToMinutes(bt.start);
      const bEnd = timeToMinutes(bt.end);
      if (serviceStart < bEnd && serviceEnd > bStart) {
        return { ok: false, reason: `This service overlaps with a blocked time (${formatTime(bt.start)}–${formatTime(bt.end)}: ${bt.reason}).` };
      }
    }
  }

  // Check existing appointments
  const dayAppts = appointments.filter(a => a.date === dateStr && (a.status === 'confirmed' || a.status === 'pending'));
  for (const a of dayAppts) {
    const aStart = timeToMinutes(a.time);
    const aEnd = aStart + a.duration;
    if (serviceStart < aEnd && serviceEnd > aStart) {
      return { ok: false, reason: 'This time overlaps with an existing appointment.' };
    }
  }

  return { ok: true };
}
