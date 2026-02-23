// src/utils/image-helpers.ts

// Dynamically import all images from the ../images directory using Vite's glob import
// The pattern includes common image extensions. 'eager: true' makes sure they are loaded immediately.
const imageModules = import.meta.glob('../images/*.{png,jpg,jpeg,gif,svg,webp}', { eager: true });

export const availableImages: string[] = Object.keys(imageModules).map(path => {
  // Extract just the filename from the path (e.g., '../images/odd.png' -> 'odd.png')
  return path.split('/').pop() || '';
}).filter(name => name !== ''); // Filter out any empty names

// Function to construct the full path to an image for use in JSX
export const getImageUrl = (imageName: string): string => {
  if (!imageName) return '';

  // Find the module that matches the imageName
  const imagePathKey = Object.keys(imageModules).find(path => path.endsWith(`/${imageName}`));
  
  // If found, return its default export (which is the URL)
  // Otherwise, return an empty string or a placeholder if needed
  return imagePathKey ? (imageModules[imagePathKey] as { default: string }).default : '';
};
