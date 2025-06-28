# Video Integration Guide for Niramay

## Swachh Bharat Mission Video

The landing page now includes an auto-playing video in the About Niramay section that replaces the previous Swachh Bharat Mission card. Follow these instructions to add your video:

### Required Files

1. **Video File**:
   - Create a `/public/videos/` directory if it doesn't exist
   - Add your video file as `/public/videos/swachh_bharat_mission.mp4`
   - **Requirements**:
     - Format: MP4 (H.264 codec recommended)
     - Resolution: 1280x720 or 1920x1080 (16:9 aspect ratio)
     - Duration: 15-30 seconds recommended (keep it short for better performance)
     - File size: Optimize to under 5MB if possible
     - No audio required (video plays muted)

2. **Poster Image**:
   - Add a poster image as `/public/images/swachh_bharat_poster.jpg`
   - This image will be shown while the video is loading
   - Should match the video's aspect ratio (16:9)
   - Resolution: 1280x720 or higher

### Video Behavior

The video component has the following features:

- **Auto-play**: The video automatically plays when it becomes visible in the viewport (at least 40% visible)
- **Pause when not visible**: The video pauses when scrolled out of view to save resources
- **Loop**: The video plays in a continuous loop
- **Muted**: The video plays without sound to comply with browser autoplay policies
- **Responsive**: The video container adjusts to different screen sizes

### Customization Options

If you need to customize the video component, you can modify the following in `LandingPage.tsx`:

```jsx
<AutoPlayVideo
  videoSrc="/videos/swachh_bharat_mission.mp4"  // Change the video path
  title="Swachh Bharat Mission"                  // Change the title
  subtitle="Supporting India's cleanliness vision" // Change the subtitle
  posterSrc="/images/swachh_bharat_poster.jpg"   // Change the poster image
  // Customize the icons below the video
  iconElements={...}
/>
```

### Troubleshooting

- **Video not playing**: Some browsers have strict autoplay policies. The video is set to muted and will only play when in view.
- **Performance issues**: If the video causes performance problems, try reducing its resolution or compressing it further.
- **Mobile optimization**: Consider providing a lower resolution version for mobile devices.

## Additional Video Integration

To add videos to other sections of the application, you can reuse the `AutoPlayVideo` component with different parameters.