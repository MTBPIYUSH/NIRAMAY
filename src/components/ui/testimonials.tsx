"use client"

import { ScrollVelocity } from "./scroll-velocity"
import React from "react"

// Images from the user's input - waste management and cleanup images
// Images for waste management and cleanup showcase
const images = [
  {
    title: "Community Cleanup Drive",
    thumbnail: "/images/cleanup1.jpg"
  },
  {
    title: "Municipal Workers in Action",
    thumbnail: "/images/cleanup2.jpg"
  },
  {
    title: "Waste Segregation Process",
    thumbnail: "/images/cleanup3.jpg"
  },
  {
    title: "Professional Waste Collection",
    thumbnail: "/images/cleanup4.jpg"
  },
  {
    title: "Student Cleanup Initiative",
    thumbnail: "/images/cleanup5.jpg"
  }
]

const velocity = [3, -3]

function ScrollVelocityDemo() {
  return (
    <div className="w-full">
      {/* Heading removed as it's now in the parent component */}
      <div className="flex flex-col space-y-5 py-10">
        {velocity.map((v, index) => (
          <ScrollVelocity key={index} velocity={v}>
            {images.map(({ title, thumbnail }) => (
              <div
                key={title}
                className="relative h-[6rem] w-[9rem] md:h-[8rem] md:w-[12rem] xl:h-[12rem] xl:w-[18rem]"
              >
                <img
                  src={thumbnail}
                  alt={title}
                  className="h-full w-full rounded-xl object-cover object-center shadow-md hover:shadow-xl transition-all duration-300"
                />
              </div>
            ))}
          </ScrollVelocity>
        ))}
        <ScrollVelocity velocity={4} className="text-green-600 font-bold">Join us in making India cleaner and healthier! Swachh Bharat, Swasth Bharat!</ScrollVelocity>
      </div>
    </div>
  )
}

export { ScrollVelocityDemo }