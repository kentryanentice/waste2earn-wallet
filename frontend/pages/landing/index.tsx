import Hero from "./components/Hero"
import Footer from "./components/Footer"
import Navbar from "./components/Navbar"

export default function Home() {
  return (
    <div className="bg-[#030014]">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  )
}


