import React, { useEffect, useState } from 'react';
import { FeatureSteps, Feature } from './feature-section';

// Constants
const AUTO_PLAY_INTERVAL = 4000; // 4 seconds

// Define the base features without fixed images
type FeatureData = Omit<Feature, 'image'>;

const featureData: FeatureData[] = [
  {
    step: 'Step 1',
    title: 'Citizen Reports',
    content: 'Click photo of garbage with automatic location tracking',
  },
  {
    step: 'Step 2',
    title: 'Admin Receives',
    content: 'Municipal admin gets real-time notification with details',
  },
  {
    step: 'Step 3',
    title: 'Worker Cleans',
    content: 'Nearest available worker gets assigned and completes task',
  },
  {
    step: 'Step 4',
    title: 'Rewards Earned',
    content: 'Citizen receives eco-points to redeem sustainable products',
  }
];

// Placeholder images for the 4 steps
const placeholderImages = [
  '/images/step1_placeholder.jpg',
  '/images/step2_placeholder.jpg',
  '/images/step3_placeholder.jpg',
  '/images/step4_placeholder.jpg',
];

/**
 * Returns the placeholder images for the steps
 * @returns Array of placeholder image paths
 */
function getStepImages(): string[] {
  return placeholderImages;
}

/**
 * Component that demonstrates the FeatureSteps with randomly selected images
 * Uses memoization to prevent unnecessary re-renders
 */
export const FeatureStepsDemo: React.FC = React.memo(() => {
  // State to hold features with random images
  const [features, setFeatures] = useState<Feature[]>([]);

  // Generate features with placeholder images on component mount
  useEffect(() => {
    // Get placeholder images for each feature
    const stepImages = getStepImages();
    
    // Combine feature data with placeholder images
    const featuresWithImages = featureData.map((feature, index) => ({
      ...feature,
      image: stepImages[index]
    }));
    
    setFeatures(featuresWithImages);

    // No cleanup needed as this only runs once on mount
  }, []);

  // If features are not loaded yet, return null or a loading state
  if (features.length === 0) {
    return null; // Or return a loading spinner/placeholder
  }

  return (
    <FeatureSteps
      features={features}
      autoPlayInterval={AUTO_PLAY_INTERVAL}
    />
  );
});