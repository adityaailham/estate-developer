import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ESTATE CCMS | Cost Control & Monitoring System",
  description: "Aplikasi Terintegrasi Manajemen Gudang Global, Mutasi FIFO Material, Upah Borongan, dan Laporan Cost Sheet Rumah untuk Developer Perumahan.",
  icons: {
    icon: "/gambar.jpg",
  },
};

import { ToastProvider } from "@/components/ToastContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-slate-50 font-sans text-slate-900 print:block print:bg-white print:w-full print:min-h-0 print:overflow-visible">
        <ToastProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden print:block print:w-full print:min-h-0 print:overflow-visible">
            <TopNav />
            <main className="flex-1 p-8 overflow-y-auto print:block print:w-full print:p-0 print:overflow-visible">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
