import { Typography } from "@material-tailwind/react";
import imgLogo from "../../../assets/img/logoRestaurante.jpg";

export const Navbar = () => {
  return (
    <nav className="bg-gray-900 shadow-lg sticky top-0 z-20">
      <div className="max-w-full mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={imgLogo}
            alt="Restaurant Logo"
            className="h-12 w-auto object-contain rounded-full border-2 border-orange-500"
          />
          <Typography variant="h4" className="font-extrabold text-white tracking-wider">
            Gourmet Admin
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          
        </div>
      </div>
    </nav>
  );
};
