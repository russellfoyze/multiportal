import { PortalFile } from "./types";

export const INITIAL_MOCK_FILES: PortalFile[] = [
  {
    id: "mock-1",
    name: "Passport - Russell Foyze.pdf",
    originalName: "Passport - Russell Foyze.pdf",
    mimeType: "application/pdf",
    size: 2516582,
    formattedSize: "2.4 MB",
    category: "Immigration",
    tags: ["passport", "russell", "identity", "uk"],
    description: "Personal UK & Bangladesh passport identification document.",
    isFavorite: true,
    createdAt: "2026-09-18T10:00:00.000Z",
    formattedDate: "18 Sep 2026",
    isMock: true,
  },
  {
    id: "mock-2",
    name: "Jannatul - Skilled Worker Visa.pdf",
    originalName: "Jannatul - Skilled Worker Visa.pdf",
    mimeType: "application/pdf",
    size: 1887436,
    formattedSize: "1.8 MB",
    category: "Immigration",
    tags: ["visa", "skilled-worker", "jannatul", "home-office"],
    description: "Official UK Skilled Worker visa grant letter and BRP details.",
    isFavorite: true,
    createdAt: "2026-09-15T14:30:00.000Z",
    formattedDate: "15 Sep 2026",
    isMock: true,
  },
  {
    id: "mock-3",
    name: "CV - Russell Foyze.docx",
    originalName: "CV - Russell Foyze.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 634880,
    formattedSize: "620 KB",
    category: "Employment",
    tags: ["cv", "resume", "employment", "tech"],
    description: "Master professional CV with work history and project portfolio.",
    isFavorite: false,
    createdAt: "2026-09-11T09:15:00.000Z",
    formattedDate: "11 Sep 2026",
    isMock: true,
  },
  {
    id: "mock-4",
    name: "Graduation - Hertfordshire.jpg",
    originalName: "Graduation - Hertfordshire.jpg",
    mimeType: "image/jpeg",
    size: 4928307,
    formattedSize: "4.7 MB",
    category: "Photos",
    tags: ["university", "graduation", "hertfordshire", "photo"],
    description: "University of Hertfordshire graduation ceremony photograph.",
    isFavorite: true,
    createdAt: "2026-09-09T16:45:00.000Z",
    formattedDate: "09 Sep 2026",
    isMock: true,
  },
  {
    id: "mock-5",
    name: "Nissan Leaf - Insurance.pdf",
    originalName: "Nissan Leaf - Insurance.pdf",
    mimeType: "application/pdf",
    size: 962560,
    formattedSize: "940 KB",
    category: "Car",
    tags: ["car", "nissan-leaf", "insurance", "vehicle"],
    description: "Annual comprehensive car insurance certificate and policy terms.",
    isFavorite: false,
    createdAt: "2026-09-02T11:20:00.000Z",
    formattedDate: "02 Sep 2026",
    isMock: true,
  },
  {
    id: "mock-6",
    name: "Suma International - Poster 01.jpg",
    originalName: "Suma International - Poster 01.jpg",
    mimeType: "image/jpeg",
    size: 3355443,
    formattedSize: "3.2 MB",
    category: "Portfolio",
    tags: ["design", "poster", "suma-international", "branding"],
    description: "Creative design deliverable for Suma International campaign.",
    isFavorite: false,
    createdAt: "2026-08-30T13:10:00.000Z",
    formattedDate: "30 Aug 2026",
    isMock: true,
  },
];

// Use globalThis to persist across Next.js dev route instances
declare global {
  var __portalMockFiles: PortalFile[] | undefined;
  var __portalMockBuffers: Map<string, Buffer> | undefined;
}

if (!globalThis.__portalMockFiles) {
  globalThis.__portalMockFiles = [...INITIAL_MOCK_FILES];
}

if (!globalThis.__portalMockBuffers) {
  globalThis.__portalMockBuffers = new Map<string, Buffer>();
}

export function getMockFiles(): PortalFile[] {
  return globalThis.__portalMockFiles!;
}

export function addMockFile(file: PortalFile): void {
  globalThis.__portalMockFiles = [file, ...globalThis.__portalMockFiles!];
}

export function updateMockFile(id: string, updates: Partial<PortalFile>): PortalFile | null {
  const files = globalThis.__portalMockFiles!;
  const index = files.findIndex((f) => f.id === id);
  if (index === -1) return null;
  files[index] = { ...files[index], ...updates };
  return files[index];
}

export function deleteMockFile(id: string): boolean {
  const initialLength = globalThis.__portalMockFiles!.length;
  globalThis.__portalMockFiles = globalThis.__portalMockFiles!.filter((f) => f.id !== id);
  globalThis.__portalMockBuffers?.delete(id);
  return globalThis.__portalMockFiles!.length < initialLength;
}

export function setMockFileBuffer(id: string, buffer: Buffer): void {
  globalThis.__portalMockBuffers!.set(id, buffer);
}

export function getMockFileBuffer(id: string): Buffer | undefined {
  return globalThis.__portalMockBuffers!.get(id);
}
