import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div>
      {/* Simplified Navbar */}
      <nav className="fixed w-full top-0 left-0 z-50 bg-transparent backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-[#2E7D32] text-2xl font-bold">Bossa Addis Kebele</h1>
          <Link href="/login" className="px-5 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-lg transition duration-300">
            Portal Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className='relative'>
        <div className='relative h-[100vh] w-[100%]'>
          <Image src={'/bg.png'} fill className='object-cover' alt='hero image' priority />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/30">
          <div className='px-8 py-1 rounded-3xl text-sm text-white bg-[#2E7D32] mb-4'>
            <p>Official Kebele Portal</p>
          </div>
          <h1 className='text-5xl lg:text-6xl w-[90%] lg:w-[50%] text-white font-bold mb-6'>
            Serving Our Community with Commitment and Integrity
          </h1>
          <p className='text-white w-[90%] lg:w-[40%] text-md lg:text-lg font-medium mb-8'>
            Empowering the residents of Bosa Addis through transparent governance and accessible digital public services.
          </p>
        </div>
      </div>
    </div>
  )
}

export default page