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
  category: string;
  tags: string[];
  description?: string;
  isFavorite: boolean;
  createdAt: string;
  formattedDate: string;
  driveViewLink?: string;
  thumbnailLink?: string;
  folderName?: string;
  isMock?: boolean;
}

export interface PortalStats {
  totalFiles: number;
  documentsCount: number;
  photosCount: number;
  favoritesCount: number;
}
