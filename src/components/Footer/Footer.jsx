import { GithubOutlined, LinkedinOutlined } from "@ant-design/icons";

const Footer = () => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Eigakan</h3>
            <p className="text-sm">
              Your ultimate destination for movie information, reviews, and
              cinema news.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/movies"
                  className="hover:text-blue-500 transition-colors"
                  aria-label="Go to Movies page"
                  tabIndex="0"
                  onKeyDown={handleKeyDown}
                >
                  Movies
                </a>
              </li>
              <li>
                <a
                  href="/news"
                  className="hover:text-blue-500 transition-colors"
                  aria-label="Go to News page"
                  tabIndex="0"
                  onKeyDown={handleKeyDown}
                >
                  News
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="hover:text-blue-500 transition-colors"
                  aria-label="Go to About Us page"
                  tabIndex="0"
                  onKeyDown={handleKeyDown}
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/MNTuas/Eigakan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="View GitHub repository"
                tabIndex="0"
                onKeyDown={handleKeyDown}
              >
                <GithubOutlined className="text-xl" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="View LinkedIn profile"
                tabIndex="0"
                onKeyDown={handleKeyDown}
              >
                <LinkedinOutlined className="text-xl" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              © {currentYear} Eigakan. All rights reserved.
            </p>
            <p className="text-sm mt-2 md:mt-0">
              Built with ❤️ by{" "}
              <a
                href="https://github.com/MNTuas/Eigakan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors"
                aria-label="View project GitHub repository"
                tabIndex="0"
                onKeyDown={handleKeyDown}
              >
                SP25-group5-475
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
