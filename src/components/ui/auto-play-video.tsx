import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface AutoPlayVideoProps {
  videoSrc: string;
  title?: string;
  subtitle?: string;
  className?: string;
  posterSrc?: string;
  iconElements?: React.ReactNode;
  muted?: boolean;
}

/**
 * A component that automatically plays a video when it becomes visible in the viewport
 * and pauses when it's out of view.
 */
export const AutoPlayVideo: React.FC<AutoPlayVideoProps> = ({
  videoSrc,
  title,
  subtitle,
  className,
  posterSrc,
  iconElements,
  muted = false
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
        // Start playing when at least 20% of the video is visible
        // Lower threshold for better user experience
        threshold: 0.2,
        rootMargin: '0px 0px 100px 0px' // Slightly extend detection area
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
      const playPromise = videoRef.current.play();
      
      // Handle potential play() promise rejection (e.g., autoplay policy)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play was prevented:', error);
          // We can show a play button or other UI here if needed
        });
      }
    } else {
      // Pause when not visible
      videoRef.current.pause();
    }
  }, [isVisible]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl",
        className
      )}
    >
      {title && (
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold mb-2">{title}</h4>
          {subtitle && <p className="text-green-100">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative rounded-xl overflow-hidden mb-6">
        <video
          ref={videoRef}
          className="w-full h-auto rounded-xl"
          loop
          muted={muted}
          playsInline
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Optional icon elements below the video */}
      {iconElements && (
        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          {iconElements}
        </div>
      )}
    </div>
  );
};

export default AutoPlayVideo;