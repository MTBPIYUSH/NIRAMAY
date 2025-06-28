import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface LargeVideoPlayerProps {
  videoSrc: string;
  className?: string;
  posterSrc?: string;
}

/**
 * A component for playing large videos (95MB+) that automatically plays/pauses
 * with audio based on visibility in the viewport.
 * No controls are shown to keep the UI clean.
 */
export const LargeVideoPlayer: React.FC<LargeVideoPlayerProps> = ({
  videoSrc,
  className,
  posterSrc,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Create an Intersection Observer to detect when the video is in the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      {
        // Start playing when video is visible in viewport
        threshold: 0.3,
        rootMargin: '0px 0px 0px 0px'
      }
    );

    // Observe the video container
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Cleanup observer on component unmount
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Play or pause the video based on visibility
  useEffect(() => {
    if (!videoRef.current) return;

    if (isVisible) {
      // Try to play the video when it becomes visible
      console.log('Video is visible, attempting to play:', videoRef.current.src);
      const playPromise = videoRef.current.play();
      
      // Handle potential play() promise rejection (e.g., autoplay policy)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Auto-play was prevented:', error);
          // We can show a play button or other UI here if needed
        });
      }
    } else {
      // Pause when not visible
      console.log('Video is not visible, pausing');
      videoRef.current.pause();
    }
  }, [isVisible]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden",
        className
      )}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted
        poster={posterSrc}
        preload="auto"
        onError={(e) => console.error('Video error:', e)}
        onLoadedData={() => console.log('Video loaded successfully')}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default LargeVideoPlayer;