// src/lib/imgUtils.ts
// PDX-112: Shared image utility functions.

import type React from 'react'

// hideImgOnError hides an image element when it fails to load.
// Use as: <img onError={hideImgOnError} ... />
export function hideImgOnError(e: React.SyntheticEvent<HTMLImageElement>): void {
  (e.target as HTMLImageElement).style.display = 'none'
}
