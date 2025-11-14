// components/Navbar.jsx
export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-20 bg-transparent">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <img
          src="/assets/images/adaptive-logo.svg" // or .png
          alt="Adaptive Atelier"
          className="h-14 w-auto" // Increased height from h-8 to h-14
        />
      </div>
    </nav>
  );
}
