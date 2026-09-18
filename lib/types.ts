export const DEFAULT_CATEGORIES: string[] = [
  "Immigration",
  "Passport",
  "Visa",
  "University",
  "Employment",
  "CV",
  "Certificates",
  "Bills",
  "Car",
  "Business",
  "Photos",
  "Portfolio",
  "Other",
];

export type FileCategory = string;

export type FileTypeFilter =
  | "All file types"
  | "PDF"
  | "Images"
  | "Word Documents"
  | "Videos"
  | "Other";

export interface PortalFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  formattedSize: string;
  category: FileCategory;
  tags: string[];
  description?: string;
  isFavorite: boolean;
  createdAt: string;
  formattedDate: string;
  driveViewLink?: string;
  thumbnailLink?: string;
  isMock?: boolean;
}

export interface PortalStats {
  totalFiles: number;
  documentsCount: number;
  photosCount: number;
  favoritesCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  initials?: string;
  avatarInitials?: string;
  twoFactorEnabled: boolean;
}

export interface DriveConfigStatus {
  isConfigured: boolean;
  serviceAccountEmail?: string;
  folderId?: string;
  folderName?: string;
  quotaUsed?: string;
  authMode?: "service_account" | "oauth2" | "demo_mock";
  error?: string;
}
