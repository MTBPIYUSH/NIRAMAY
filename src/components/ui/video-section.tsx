import React from 'react';
import { LargeVideoPlayer } from './large-video-player';

interface VideoSectionProps {
  videoSrc: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * A section component that displays a large video with title and subtitle
 * The video automatically plays/pauses with audio when in/out of viewport
 */
export const VideoSection: React.FC<VideoSectionProps> = ({
  videoSrc,
  posterSrc,
  title = "Swachh Bharat Mission",
  subtitle = "Supporting India's cleanliness vision",
  className,
}) => {
  return (
    <section className="py-16 bg-gradient-to-br from-green-400 to-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {title && <h3 className="text-3xl font-bold mb-2">{title}</h3>}
          {subtitle && <p className="text-xl text-green-100">{subtitle}</p>}
        </div>
        
        <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-white">
          <div className="bg-black p-4 text-center text-sm text-white">
            Video Path: {videoSrc}
          </div>
          <LargeVideoPlayer 
            videoSrc={videoSrc} 
            posterSrc={posterSrc}
            className="min-h-[400px]"
          />
        </div>
        
        <div className="mt-8 flex justify-center space-x-12">
          {/* Icons below video */}
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🇮🇳</span>
            </div>
            <p className="text-sm font-medium">Made in India</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🌱</span>
            </div>
            <p className="text-sm font-medium">Eco-Friendly</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-sm font-medium">Community First</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;