import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
export const metadata = {
  title: "CBT SaaS",
  description: "Enterprise CBT System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
      <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}



