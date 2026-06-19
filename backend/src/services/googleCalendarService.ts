import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const getAuthUrl = (state: string) => {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new HttpError(400, "Google OAuth variables are not set in .env");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return url.toString();
};

export const handleOAuthCallback = async (userId: string, code: string) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new HttpError(400, "Google OAuth variables are not set in .env");
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
    throw new HttpError(400, "Google OAuth variables are not set in .env");
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
