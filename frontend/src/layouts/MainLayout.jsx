import Navbar from "../components/common/Navbar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[black] text-white">
      <Navbar />
      {children}
    </div>
  );
}

export default MainLayout;