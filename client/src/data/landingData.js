import {
  Cloud,
  Users,
  ShieldCheck,
  Laptop,
  Upload,
  Search,
  Trash2,
  Shield,
  Smartphone,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features", hasDropdown: false },
  { label: "Workflow", href: "#workflow", hasDropdown: false },
  { label: "Pricing", href: "#pricing", hasDropdown: false },
  { label: "Contact", href: "#contact", hasDropdown: false },
];

export const quickHighlights = [
  {
    title: "Easy Upload",
    description: "Drag, drop, and upload files in seconds.",
    icon: Cloud,
  },
  {
    title: "Share Securely",
    description: "Share files and folders with anyone, with full control.",
    icon: Users,
  },
  {
    title: "Privacy First",
    description: "Your data is protected with end-to-end encryption.",
    icon: ShieldCheck,
  },
  {
    title: "Access Anywhere",
    description: "Access your files from any device, anytime.",
    icon: Laptop,
  },
];

export const clientLogos = [
  { name: "Acme Corp", initial: "A" },
  { name: "Vertex", initial: "V" },
  { name: "Echo Studios", initial: "E" },
  { name: "PulseLab", initial: "P" },
  { name: "Nexora", initial: "N" },
];

export const features = [
  {
    title: "Easy Upload",
    description: "Drag, drop, and upload files in seconds. Big or small, we've got you covered.",
    icon: Upload,
    type: "upload",
  },
  {
    title: "Share Securely",
    description: "Share files and folders with anyone. Set permissions and stay in control.",
    icon: Users,
    type: "share",
  },
  {
    title: "Privacy First",
    description: "Your data is protected with end-to-end encryption and advanced security measures.",
    icon: Shield,
    type: "privacy",
  },
  {
    title: "Access Anywhere",
    description: "Access your files from any device, anytime. Your cloud, always with you.",
    icon: Smartphone,
    type: "access",
  },
  {
    title: "Semantic Search",
    description: "Find what you need without remembering filenames. Search by meaning, content, or keywords.",
    icon: Search,
    type: "search",
  },
  {
    title: "Smart Trash",
    description: "Deleted files aren't gone forever. Recover them within 30 days.",
    icon: Trash2,
    type: "trash",
  },
];

export const workflowSteps = [
  {
    step: "01",
    title: "Upload Documents",
    description: "Drag and drop your PDFs, images, or sheets into Kumori in seconds.",
  },
  {
    step: "02",
    title: "AI Indexing & Semantic Search",
    description: "OCR content extraction and vector embeddings enable instant, concept-based semantic search across all your documents.",
  },
  {
    step: "03",
    title: "Secure URL Delivery",
    description: "Generate signed public access links with custom lifetimes and tracking.",
  },
];

export const footerLinks = {
  Product: ["Features", "Solutions", "Pricing", "Security"],
  Company: ["About Us", "Careers", "Blog", "Press"],
  Resources: ["Documentation", "Help Center", "Community", "Status"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Settings"],
};

export const contactLinks = ["support@kumori.ai", "+81 (0) 3 1234 5678"];

export const testimonials = [
  {
    quote: "Kumori made document retrieval feel immediate. The semantic search results finally match how we actually think.",
    name: "Maya Chen",
    role: "Operations Lead, Northstar",
  },
  {
    quote: "OCR search and relevance ranking cut our internal search time significantly.",
    name: "Kenji Sato",
    role: "Product Manager, Soma",
  },
];
