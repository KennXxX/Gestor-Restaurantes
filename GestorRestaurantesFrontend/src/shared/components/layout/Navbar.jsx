import { Typography } from "@material-tailwind/react";
import imgLogo from "../../../assets/img/logoRestaurante.jpg";

export const Navbar = () => {
  return (
    <nav className="bg-black shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={imgLogo}
            alt="Kinal Logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
          <Typography variant="h5" className="font-bold text-white">
            Kinal Admin
          </Typography>
        </div>
        <div className="flex items-center gap-4">

        </div>
      </div>
    </nav>
  );
};
