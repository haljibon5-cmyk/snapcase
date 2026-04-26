import React from "react";
import { Link } from "react-router-dom";
import { Home, CarFront } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[60vh]">
      <h2 className="text-xl md:text-2xl text-gray-800 mb-8 font-light">
        <span className="font-bold">Oops;</span> Sorry, but the page you were
        trying to
        <br className="hidden md:block" /> view does not exist.
      </h2>

      <h1 className="text-[120px] md:text-[220px] font-black text-[#2f2f2f] leading-none mb-10 tracking-tighter">
        404
      </h1>

      <Link
        to="/"
        className="flex items-center gap-2 text-gray-800 hover:text-black transition-colors font-medium"
      >
        <CarFront className="w-5 h-5" />
        Back to Home
      </Link>
    </div>
  );
}
