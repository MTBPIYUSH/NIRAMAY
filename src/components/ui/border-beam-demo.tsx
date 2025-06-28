import { BorderBeam } from "./border-beam";
import { LargeVideoPlayer } from "./large-video-player";

interface BorderBeamDemoProps {
  videoSrc?: string;
  posterSrc?: string;
}

export function BorderBeamDemo({ videoSrc = "/videos/swachh-bharat.mp4", posterSrc = "/images/cleanup1.jpg" }: BorderBeamDemoProps) {
  return (
    <div className="relative h-[400px] w-full max-w-[800px] overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <div className="absolute inset-0 z-10">
        <LargeVideoPlayer 
          videoSrc={videoSrc} 
          posterSrc={posterSrc}
          className="w-full h-full"
        />
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none">
        <BorderBeam 
          size={180} 
          duration={15} 
          delay={5} 
          borderWidth={2.5} 
          anchor={85}
          colorFrom="#40ffaa" 
          colorTo="#4080ff" 
        />
      </div>
    </div>
  );
}