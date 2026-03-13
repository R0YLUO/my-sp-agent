import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Stock Planner Agent',
  description: 'Chat interface for AWS Bedrock Agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
