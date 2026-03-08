import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Editor } from './pages/Editor';
import { Admin } from './pages/Admin';
import { Image as ImageIcon, Menu, X } from 'lucide-react';

function Nav() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

  return (
        <header className="bg-[#1E3A8A] text-white sticky top-0 z-50 shadow-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                      <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
                                <img src="/234172861.png" alt="SmartStageAgent.com" className="h-10 w-auto" />
                                <span className="hidden sm:inline">SmartStageAgent</span>span>
                                <span className="text-orange-400">.com</span>span>
                      </Link>Link>
              
                {/* Desktop nav */}
                      <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
                                <Link to="/" className={`hover:text-orange-300 transition-colors ${location.pathname === '/' ? 'text-orange-300' : ''}`}>Home</Link>Link>
                                <Link to="/editor" className={`hover:text-orange-300 transition-colors flex items-center gap-1 ${location.pathname === '/editor' ? 'text-orange-300' : ''}`}>
                                            <ImageIcon className="w-4 h-4" /> Enhance Photos
                                </Link>Link>
                      </nav>nav>
              
                {/* Mobile hamburger */}
                      <button
                                  className="sm:hidden p-2 rounded hover:bg-blue-800 transition-colors"
                                  onClick={() => setMenuOpen(!menuOpen)}
                                  aria-label="Toggle menu"
                                >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </button>button>
              </div>div>
        
          {/* Mobile dropdown */}
          {menuOpen && (
                  <div className="sm:hidden bg-[#162f7a] border-t border-blue-700 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
                            <Link to="/"i mopnoCrlti cRke=a{c(t),  ={>  usseetSMteantueO p}e nf(rfoaml s'er)e}a cctl'a;s
                  siNmapmoer=t{ `{h oBvreorw:steerxRto-uotrearn,g eR-o3u0t0e st,r aRnosuittei,o nL-icnokl,o russ e$L{olcoactaitoino,n .Npaavtihgnaatmee  }= =f=r o'm/ '' r?e a'ctte-xrto-uotrearn-gdeo-m3'0;0
                  'i m:p o'r't} `{} >HHoommee <}/ Lfirnokm> 
                  ' . / p a g e s / H o<mLei'n;k
                   itmop=o"r/te d{i tEodri"t oorn C}l ifcrko=m{ ('). /=p>a gseest/MEedniutOopre'n;(
                  fiamlpsoer)t}  {c lAadsmsiNna m}e =f{r`ohmo v'e.r/:ptaegxets-/oArdamnigne'-;3
                  0i0m ptorratn s{i tIimoang-ec oalso rIsm afgleeIxc oint,e mMse-ncue,n tXe r}  gfarpo-m1  '$l{ulcoicdaet-iroena.cpta't;h
                  n
                  afmuen c=t=i=o n' /Neadvi(t)o r{'
                    ?  c'otnesxtt -loorcaantgieo-n3 0=0 'u s:e L'o'c}a`t}i>o
                  n ( ) ; 
                       c o n s t  <[ImmeangueOIpceonn,  csleatsMseNnaumOep=e"nw]- 4=  hu-s4e"S t/a>t eE(nfhaalnscee) ;P
                       h
                       o t orse
                       t u r n   ( 
                               <</>hLeiandke>r
                         c l a s s N a m<e/=d"ibvg>-
                       [ # 1 E 3 A 8)A}]
                         t e x t<-/whheiatdee rs>t
                         i c k)y; 
                         t}o
                         p
                         -f0u nzc-t5i0o ns hAapdpoLwa-ymodu"t>(
                         )   { 
                                r<edtiuvr nc l(a
                         s s N a m<ed=i"vm acxl-aws-s7Nxalm em=x"-maiunt-oh -psxc-r4e esnm :bpgx--s6l altge:-p5x0- 8f lhe-x1 6f lfelxe-xc oilt efmosn-tc-esnatnesr  tjeuxstt-isflya-tbee-t9w0e0e"n>"
                         > 
                                   < N a v< L/i>n
                         k   t o = " /<"m acilna scslNaasmseN=a"mfel=e"xf lietxe-m1s -fcleenxt efrl egxa-pc-o2l "f>o
                         n t - b o l d   t<eRxotu-txels >t
                         r a c k i n g - t i g<hRto usther ipnakt-h0="">/
                         "   e l e m e n t = {<<iHmogm es r/c>=}" //2>3
                         4 1 7 2 8 6 1 . p n g<"R oaultte= "pSamtahr=t"S/teadgietAogre"n te.lceomme"n tc=l{a<sEsdNiatmoer= "/h>-}1 0/ >w
                           - a u t o "   / > 
                           < R o u t e   p a t<hs=p"a/ne nchlaanscseN"a meel=e"mheindtd=e{n< Nsamv:iignaltien et"o>=S"m/aerdtiSttoarg"e Argeepnlta<c/es p/a>n}> 
                         / > 
                                         <<s/pRaonu tcelsa>s
                                         s N a m e = "<t/emxati-no>r
                                         a n g e - 4 0<0f"o>o.tceorm <c/lsapsasnN>a
                                         m e = " b g - s l<a/tLei-n9k0>0
                                          
                                         t e x t - s l a t{e/-*4 0D0e spkyt-o8p  bnoarvd e*r/-}t
                                           b o r d e r - s<lnaatve -c8l0a0s"s>N
                                         a m e = " h i d d<edni vs mc:lfalsesxN aimtee=m"sm-acxe-nwt-e7rx lg ampx--6a utteox tp-xs-m4  fsomn:tp-xm-e6d ilugm:"p>x
                                         - 8   f l e x   f l e<xL-icnokl  tmod=:"f/l"e xc-lraosws Njaumset=i{f`yh-obveetrw:eteenx ti-toermasn-gcee-n3t0e0r  tgraapn-s4i"t>i
                                         o n - c o l o r s   $<{ilmogc astrico=n"./p2a3t4h1n7a2m8e6 1=.=p=n g'"/ 'a l?t ='"tSemxatr-toSrtaanggeeA-g3e0n0t'. c:o m'"' }c`l}a>sHsoNmaem<e/=L"ihn-k8> 
                                         w - a u t o   o p a c<iLtiyn-k7 0t"o =/">/
                                         e d i t o r "   c l a<sdsiNva mcel=a{s`shNoavmeer=:"tteexxtt--osrma ntgeex-t3-0c0e nttrearn"s>i
                                         t i o n - c o l o r s   f© l2e0x2 6i tSemmasr-tcSetnatgeerA ggeanpt-.1c o$m{.l oAclalt iroing.hptast hrneasmeer v=e=d=. 
                                         ' / e d i t o r '   ?   '<tsepxatn- ocrlaansgseN-a3m0e0='" m:x -'2' }t`e}x>t
                                         - s l a t e - 6 0 0 " > |<<I/msapgaenI>c
                                         o n   c l a s s N a m e =<"swp-a4n  hc-l4a"s s/N>a mEen=h"atnecxet -Pshloattoes-
                                         5 0 0 " > A I - e n h<a/nLciendk >p
                                         h o t o s   a r e< /dnealve>t
                                         e
                                         d   w i t h i n  {2/4*  hMooubrisl.e  Dhiasmcbluorsgee rA I* /e}n
                                         h a n c e m e n t<sb uatst orne
                                                            q u i r e d   b y   ycoluars sMNLaSm.e<=/"sspma:nh>i
                                                            d d e n   p - 2   r o<u/nddievd> 
                                                            h o v e r : b g -<b/lduiev->8
                                                            0 0   t r a n<s/iftoiootne-rc>o
                                                            l o r s "<
                    / d i v > 
                                                                 ) ; 
                                                            o}n
                                                            C
                                                            leixcpko=r{t( )d e=f>a uslett MfeunnucOtpieonn( !Ampepn(u)O p{e
                                                              n ) }r
                                                            e t u r n   ( 
                                                                  a r<iBar-olwasbeerlR=o"uTtoegrg>l
                                                            e   m e n u "<
                      R o u t e s > 
                                                              > 
                                                                        < R o u t{em epnautOhp=e"n/ a?d m<iXn "c lealsesmNeanmte=={"<wA-d5m ihn- 5/"> }/ >/ >:
                                                                            < M e n u   c l<aRsosuNtaem ep=a"twh-=5" *h"- 5e"l e/m>e}n
                                                            t = { < A p p L a<y/obuutt t/o>n}> 
                                                            / > 
                                                                    < / d<i/vR>o
                                                                    u
                                                                    t e s > 
                                                                      { / *< /MBorboiwlsee rdRroouptdeorw>n
                                                                      * /)};
                                                                    
                                                                      }     {menuOpen && (
                                <div className="sm:hidden bg-[#162f7a] border-t border-blue-700 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
                                          <Link to="/" onClick={() => setMenuOpen(false)} className={`hover:text-orange-300 transition-colors ${location.pathname === '/' ? 'text-orange-300' : ''}`}>Home</Link>Link>
                                          <Link to="/editor" onClick={() => setMenuOpen(false)} className={`hover:text-orange-300 transition-colors flex items-center gap-1 ${location.pathname === '/editor' ? 'text-orange-300' : ''}`}>
                                                      <ImageIcon className="w-4 h-4" /> Enhance Photos
                                          </Link>Link>
                                </div>div>
                                                                          )}
                                                                    </>header>
                                                              );
                                                              }
                                                            
                                                            function AppLayout() {
                                                                return (
                                                                <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
                                                                      <Nav />
                                                                      <main className="flex-1 flex flex-col">
                                                                              <Routes>
                                                                                        <Route path="/" element={<Home />} />
                                                                                        <Route path="/editor" element={<Editor />} />
                                                                                        <Route path="/enhance" element={<Navigate to="/editor" replace />} />
                                                                              </Routes>Routes>
                                                                      </main>main>
                                                                      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
                                                                              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                                                                                        <img src="/234172861.png" alt="SmartStageAgent.com" className="h-8 w-auto opacity-70" />
                                                                                        <div className="text-sm text-center">
                                                                                                    © 2026 SmartStageAgent.com. All rights reserved.
                                                                                                    <span className="mx-2 text-slate-600">|</span>span>
                                                                                                    <span className="text-slate-500">AI-enhanced photos are deleted within 24 hours. Disclose AI enhancements as required by your MLS.</span>span>
                                                                                        </div>div>
                                                                              </div>div>
                                                                      </footer>footer>
                                                                </div>div>
                                                              );
                                                              }
                                                            
                                                            export default function App() {
                                                                return (
                                                                <BrowserRouter>
                                                                      <Routes>
                                                                              <Route path="/admin" element={<Admin />} />
                                                                              <Route path="*" element={<AppLayout />} />
                                                                      </Routes>Routes>
                                                                </BrowserRouter>BrowserRouter>
                                                              );
                                                              }</header>
