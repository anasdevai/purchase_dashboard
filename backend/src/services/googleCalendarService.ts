import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

// All Google OAuth config flows through the validated `env` object so every read
// uses the exact same variable names: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
// GOOGLE_REDIRECT_URI (which itself can be derived from FRONTEND_URL in env.ts).
const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = env.GOOGLE_REDIRECT_URI;

type GoogleOAuthVar = "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "GOOGLE_REDIRECT_URI";

/** Returns the names of any required Google OAuth env vars that are not set. */
const collectMissingGoogleVars = (names: GoogleOAuthVar[]): string[] => {
  const values: Record<GoogleOAuthVar, string | undefined> = {
    GOOGLE_CLIENT_ID: CLIENT_ID,
    GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: REDIRECT_URI
  };
  return names.filter((name) => !values[name]);
};

/**
 * Logs the missing variable NAMES only (never secret values) and returns an
 * HttpError to throw. Returning (instead of throwing) keeps the `throw` at the
 * call site so TypeScript can narrow the checked variables afterwards.
 */
const googleConfigError = (required: GoogleOAuthVar[]): HttpError => {
  const missing = collectMissingGoogleVars(required);
  console.error(
    `[google-oauth] Missing required env variable(s): ${missing.join(", ")}. ` +
      `Check backend/.env (GOOGLE_REDIRECT_URI can also be derived from FRONTEND_URL).`
  );
  return new HttpError(400, `Google OAuth is not configured. Missing: ${missing.join(", ")}`);
};

// One-time startup diagnostic so a misconfigured deployment is obvious in logs.
const missingGoogleVarsAtStartup = collectMissingGoogleVars([
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI"
]);
if (missingGoogleVarsAtStartup.length > 0) {
  console.warn(
    `[google-oauth] Calendar integration not configured — missing env: ${missingGoogleVarsAtStartup.join(", ")}`
  );
}

/**
 * Minimum scopes required by this app.
 *
 * The integration only creates, reads, updates and deletes the app's own
 * appointment events on the user's primary calendar (see createGoogleEvent /
 * updateGoogleEvent / deleteGoogleEvent below). The single event-level scope
 * below covers all of that.
 *
 * We intentionally do NOT request `.../auth/calendar` (full read/write to all
 * calendars, including deleting calendars and managing sharing/ACLs), since the
 * app never needs that and it makes the consent screen look alarming.
 *
 * Scope reference:
 *   calendar.events – create/read/update/delete events on the user's calendars.
 */
const GOOGLE_OAUTH_SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export const getAuthUrl = (state: string) => {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw googleConfigError(["GOOGLE_CLIENT_ID", "GOOGLE_REDIRECT_URI"]);
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return url.toString();
};

export const handleOAuthCallback = async (userId: string, code: string) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw googleConfigError(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Failed to exchange auth code:", errText);
    throw new HttpError(400, "Failed to authenticate with Google");
  }

  const tokens = await response.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

  const updateData: any = {
    googleAccessToken: tokens.access_token,
    googleTokenExpiry: expiryDate
  };

  if (tokens.refresh_token) {
    updateData.googleRefreshToken = tokens.refresh_token;
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  // Sync any unsynced future appointments to Google Calendar
  try {
    await syncUnsyncedAppointments(userId);
  } catch (syncErr) {
    console.error(`Failed to sync appointments after OAuth callback for user ${userId}:`, syncErr);
  }
};

export const getGoogleAccessToken = async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true
    }
  });

  if (!user || !user.googleAccessToken) {
    return null;
  }

  const now = new Date();
  if (user.googleTokenExpiry && user.googleTokenExpiry > now) {
    return user.googleAccessToken;
  }

  // Token expired, refresh it
  if (!user.googleRefreshToken) {
    return null;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw googleConfigError(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: user.googleRefreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    console.error("Failed to refresh Google access token");
    return null;
  }

  const tokens = await response.json() as {
    access_token: string;
    expires_in: number;
  };

  const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token,
      googleTokenExpiry: expiryDate
    }
  });

  return tokens.access_token;
};

export const createGoogleEvent = async (
  userId: string,
  appt: {
    title: string;
    startTime: Date;
    endTime: Date;
    note?: string | null;
  }
): Promise<string | null> => {
  const token = await getGoogleAccessToken(userId);
  if (!token) return null;

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: appt.title,
      description: appt.note || "",
      start: { dateTime: appt.startTime.toISOString() },
      end: { dateTime: appt.endTime.toISOString() }
    })
  });

  if (!response.ok) {
    console.error("Failed to create Google Calendar event:", await response.text());
    return null;
  }

  const data = await response.json() as { id: string };
  return data.id;
};

export const updateGoogleEvent = async (
  userId: string,
  googleEventId: string,
  appt: {
    title: string;
    startTime: Date;
    endTime: Date;
    note?: string | null;
  }
): Promise<boolean> => {
  const token = await getGoogleAccessToken(userId);
  if (!token) return false;

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: appt.title,
      description: appt.note || "",
      start: { dateTime: appt.startTime.toISOString() },
      end: { dateTime: appt.endTime.toISOString() }
    })
  });

  if (!response.ok) {
    console.error("Failed to update Google Calendar event:", await response.text());
    return false;
  }

  return true;
};

export const deleteGoogleEvent = async (
  userId: string,
  googleEventId: string
): Promise<boolean> => {
  const token = await getGoogleAccessToken(userId);
  if (!token) return false;

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 404) {
    console.error("Failed to delete Google Calendar event:", await response.text());
    return false;
  }

  return true;
};

export const syncUnsyncedAppointments = async (userId: string): Promise<void> => {
  // Find all appointments for this user that don't have a googleCalendarEventId and starting in the future
  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
      googleCalendarEventId: null,
      startTime: {
        gte: new Date()
      }
    }
  });

  for (const appt of appointments) {
    try {
      const eventId = await createGoogleEvent(userId, {
        title: appt.title,
        startTime: appt.startTime,
        endTime: appt.endTime,
        note: appt.note
      });
      if (eventId) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { googleCalendarEventId: eventId }
        });
      }
    } catch (err) {
      console.error(`Failed to sync appointment ${appt.id} to Google Calendar during post-auth sync:`, err);
    }
  }
};

