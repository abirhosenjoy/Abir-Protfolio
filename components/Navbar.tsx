import React, { useState } from 'react';

interface NavbarProps {
  scrolled: boolean;
  name: string;
  profilePic: string;
  onViewChange: (view: 'portfolio' | 'news') => void;
  currentView: 'portfolio' | 'news';
}

const Navbar: React.FC<NavbarProps> = ({ scrolled, name, profilePic, onViewChange, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLightMode = currentView === 'news' && !scrolled;
  const nameColor = isLightMode ? 'text-slate-900' : 'text-white';
  const linkColorClass = isLightMode 
    ? 'text-slate-600 hover:text-brand-600' 
    : 'text-slate-300 hover:text-cyan-400';
  const activeLinkClass = isLightMode 
    ? 'text-brand-600 underline decoration-2 underline-offset-8' 
    : 'text-cyan-400 underline decoration-2 underline-offset-8';
  const mobileButtonBg = isLightMode ? 'bg-slate-200/50' : 'bg-slate-700/50';
  const mobileButtonText = isLightMode ? 'text-slate-900' : 'text-white';

  const navLinks = [
    { name: 'Home', href: '#home', view: 'portfolio' as const },
    { name: 'About', href: '#about', view: 'portfolio' as const },
    { name: 'Leadership', href: '#leadership', view: 'portfolio' as const },
    { name: 'Projects', href: '#projects', view: 'portfolio' as const },
    { name: 'News', href: '#news', view: 'news' as const },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string, view: 'portfolio' | 'news') => {
    e.preventDefault();
    
    if (currentView !== view) {
      onViewChange(view);
    }
    
    if (view === 'portfolio') {
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      
      if (element) {
        const headerOffset = scrolled ? 64 : 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 print:hidden ${scrolled ? 'bg-nav/95 backdrop-blur-lg border-b border-white/5 h-16 shadow-2xl' : 'bg-transparent h-20'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div 
            className={`flex-shrink-0 flex items-center gap-3 font-heading font-bold text-lg md:text-2xl ${nameColor} tracking-wider cursor-pointer group transition-colors duration-500`} 
            onClick={(e) => handleNavClick(e, '#home', 'portfolio')}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-cyan-500 overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <img src={profilePic} alt={name} className="w-full h-full object-cover" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${name}&background=233d4d&color=fff`;
              }} />
            </div>
            <span className="inline uppercase font-black tracking-tighter sm:tracking-widest">
              <span className="name-gradient">{name}</span><span className="text-cyan-400">.</span>
            </span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6 lg:space-x-8">
              {navLinks.map((link) => {
                const isActive = (link.view === currentView && ((currentView as string) === 'news' || (window.location.hash === link.href)));
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href, link.view)}
                    className={`px-3 py-2 rounded-md text-sm font-bold transition-all hover:-translate-y-0.5 ${
                      isActive ? activeLinkClass : linkColorClass
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`text-2xl ${mobileButtonText} focus:outline-none w-10 h-10 flex items-center justify-center rounded-lg ${mobileButtonBg} active:scale-90 transition-all duration-500`}
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden absolute w-full bg-nav/98 backdrop-blur-xl border-b border-white/5 px-4 pt-2 pb-8 space-y-2 transition-all duration-300 origin-top shadow-2xl ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href, link.view)}
            className={`block px-4 py-4 rounded-xl text-base font-bold transition-all ${
              link.view === currentView ? 'bg-cyan-600/20 text-cyan-400' : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {link.name}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;