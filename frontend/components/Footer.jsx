// components/Footer.jsx - Simple green background with logo SVG
export default function Footer() {
  return (
    <footer className="bg-[#132A13] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center">
          {/* Adaptive Atelier SVG Logo */}
          <img
            src="/assets/images/footer-logo.svg"
            alt="Adaptive Atelier"
            className="w-auto h-16 md:h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
        
        {/* Optional: Very subtle copyright line */}
        <div className="mt-8 text-white/40 text-sm text-center">
          © {new Date().getFullYear()} Adaptive Atelier. All rights reserved.
        </div>
      </div>
    </footer>
  );
}