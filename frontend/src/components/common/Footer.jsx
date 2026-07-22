import { useSelector } from "react-redux";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const adminEmail = "cognon.elearning@gmail.com";
  const adminPhone = "7012334610";

  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Main grid — 4 columns matching the image */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-white">Cognon</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Empowering learners worldwide with quality education. Join
              thousands of students and expert tutors in our learning community.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              {/* Twitter */}
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                "Browse Courses",
                "Categories",
                "About Us",
                "Contact",
                "Help Center",
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — For Educators */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">
              For Educators
            </h3>
            <ul className="space-y-2.5">
              {[
                "Become a Tutor",
                "Tutor Login",
                "Teaching Guide",
                "Resources",
                "Tutor Support",
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact Us */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{adminEmail}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{adminPhone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  123 Education Street
                  <br />
                  Learning City, LC 12345
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            © 2024 Cognon. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-gray-500 text-sm hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-500 text-sm hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-gray-500 text-sm hover:text-white transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
