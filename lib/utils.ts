import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import jwt from 'jsonwebtoken';
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month));

  return new Intl.DateTimeFormat('es', { month: 'short' }).format(date);
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(price);
};

export async function createDashboardJwt(userId: string, email: string, encryptionKey: string): Promise<string> {
  const payload = {
    userId: userId,
    email: email,
  };

  // Cast encryptionKey to avoid type issues
  const secret = Buffer.from(encryptionKey, 'utf-8');
  
  // Set expiration manually (15 minutes by default)
  const expTimeStr = process.env.DASHBOARD_JWT_EXPIRATION_TIME || '15m';
  const expTime = typeof expTimeStr === 'string' && expTimeStr.endsWith('m') 
    ? parseInt(expTimeStr.slice(0, -1)) * 60 // convert minutes to seconds
    : 15 * 60; // default 15 minutes in seconds
  
  const token = jwt.sign(payload, secret, { 
    expiresIn: expTime // number of seconds
  });

  return token;
}

export async function validateDashboardJwt(token: string, encryptionKey: string): Promise<any> {
  const secret = Buffer.from(encryptionKey, 'utf-8');
  const decoded = jwt.verify(token, secret) as any;
  return decoded;
}

export const isChapterAccessible = (chapter: {
  startTime?: Date | null;
  endTime?: Date | null;
}): boolean => {
  if (!chapter.startTime || !chapter.endTime) {
    return true;
  }

  const now = new Date();
  const startTime = new Date(chapter.startTime);
  const endTime = new Date(chapter.endTime);

  return now >= startTime && now <= endTime;
};

export const createInvitationToken = () => {
  return randomBytes(32).toString('hex');
};

export const handleTemplateSelect = (
  setSubject: (subject: string) => void,
  setContent: (content: string) => void
) => (subject: string, content: string) => {
  setSubject(subject);
  setContent(content);
};