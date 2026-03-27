import { Footer } from "@/components/landing-page/footer";
import { Header } from "@/components/landing-page/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronRight,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Safzan Data Sub",
  description: "Get in touch with Safzan Data Sub for support, inquiries, and assistance.",
};

export default function ContactPage() {
  const contactOptions = [
    {
      icon: MessageCircle,
      title: "WhatsApp Chat",
      description: "Fastest response via WhatsApp",
      action: "Start Chat",
      href: "https://wa.me/2349000000000",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@safzan-data.com",
      action: "Send Email",
      href: "mailto:support@safzan-data.com",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Available 9AM - 6PM",
      action: "Call Now",
      href: "tel:+2349000000000",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Contact Support
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re here to help you with any questions or issues. Choose your preferred way to reach out.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {contactOptions.map((option) => (
              <Card key={option.title} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className={`p-3 rounded-full w-fit mb-4 ${option.color}`}>
                    <option.icon className="size-6" />
                  </div>
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={option.href} target={option.href.startsWith("http") ? "_blank" : undefined}>
                      {option.action}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white/20 p-6 rounded-full">
                  <Headphones className="size-16" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">Need immediate help?</h2>
                  <p className="text-primary-foreground/90 mb-6">
                    Check our Frequently Asked Questions for quick answers to common issues.
                  </p>
                  <Button variant="secondary" size="lg" asChild>
                    <Link href="/#faq">View FAQs</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
