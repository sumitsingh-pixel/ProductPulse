
// import React from 'react';
// import { Search, BarChart3, ListTodo, Globe, Briefcase, HeartPulse, ShoppingCart, ShieldCheck, Scale, Lock, Info, MessageSquare } from 'lucide-react';

// export const DOMAIN_TYPES = [
//   { id: 'sales', name: 'Sales', description: 'Revenue generation, pipeline management, customer acquisition', icon: <Briefcase className="w-5 h-5" /> },
//   { id: 'finance', name: 'Finance', description: 'Financial planning, accounting, investment, risk management', icon: <BarChart3 className="w-5 h-5" /> },
//   { id: 'healthcare', name: 'Healthcare', description: 'Patient care, operations, compliance, clinical performance', icon: <HeartPulse className="w-5 h-5" /> },
//   { id: 'ecommerce', name: 'E-commerce', description: 'Online sales, conversion optimization, digital marketing', icon: <ShoppingCart className="w-5 h-5" /> },
// ];

// export const TOOL_CARDS = [
//   {
//     id: 'SEO_Lighthouse',
//     title: 'SEO & Analytics Report Generator',
//     description: 'Bulk Lighthouse audits for performance, accessibility, and SEO insights.',
//     icon: <Search className="w-8 h-8 text-blue-600" />,
//     color: 'border-blue-200 hover:border-blue-400'
//   },
//   {
//     id: 'GA4_KPI',
//     title: 'GA4 KPI Tracking & Recommendation',
//     description: 'AI-driven business metrics alignment and threshold monitoring.',
//     icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
//     color: 'border-purple-200 hover:border-purple-400'
//   },
//   {
//     id: 'EPIC_PRIORITY',
//     title: 'Epic & Story Prioritization',
//     description: 'Strategic backlog refinement using RICE and MoSCoW methodologies.',
//     icon: <ListTodo className="w-8 h-8 text-emerald-600" />,
//     color: 'border-emerald-200 hover:border-emerald-400'
//   },
//   {
//     id: 'SENTIMENT_ANALYSIS',
//     title: 'Sentiment Analysis Application',
//     description: 'Harness AI to analyze customer feedback and gauage product reception.',
//     icon: <MessageSquare className="w-8 h-8 text-rose-600" />,
//     color: 'border-rose-200 hover:border-rose-400'
//   }
// ];

// export const COMPLIANCE_OPTIONS = [
//   { id: 'gdpr', name: 'GDPR', icon: <ShieldCheck className="w-4 h-4" /> },
//   { id: 'accessibility', name: 'Accessibility (WCAG)', icon: <Scale className="w-4 h-4" /> },
//   { id: 'security', name: 'Security (SOC2)', icon: <Lock className="w-4 h-4" /> },
//   { id: 'availability', name: 'High Availability', icon: <Info className="w-4 h-4" /> },
// ];




import React from 'react';
import { Search, BarChart3, ListTodo, Globe, Briefcase, HeartPulse, ShoppingCart, ShieldCheck, Scale, Lock, Info, MessageSquare } from 'lucide-react';

export const DOMAIN_TYPES = [
  { id: 'sales', name: 'Sales', description: 'Revenue generation, pipeline management, customer acquisition', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'finance', name: 'Finance', description: 'Financial planning, accounting, investment, risk management', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'healthcare', name: 'Healthcare', description: 'Patient care, operations, compliance, clinical performance', icon: <HeartPulse className="w-5 h-5" /> },
  { id: 'ecommerce', name: 'E-commerce', description: 'Online sales, conversion optimization, digital marketing', icon: <ShoppingCart className="w-5 h-5" /> },
];

export const TOOL_CARDS = [
  {
    id: 'SEO_Lighthouse',
    title: 'SEO & Analytics Report Generator',
    description: 'Bulk Lighthouse audits for performance, accessibility, and SEO insights.',
    icon: <Search className="w-8 h-8 text-blue-600" />,
    color: 'border-blue-200 hover:border-blue-400'
  },
  {
    id: 'GA4_KPI',
    title: 'GA4 KPI Tracking & Recommendation',
    description: 'AI-driven business metrics alignment and threshold monitoring.',
    icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
    color: 'border-purple-200 hover:border-purple-400'
  },
  {
    id: 'EPIC_PRIORITY',
    title: 'Epic & Story Prioritization',
    description: 'Strategic backlog refinement using RICE and MoSCoW methodologies.',
    icon: <ListTodo className="w-8 h-8 text-emerald-600" />,
    color: 'border-emerald-200 hover:border-emerald-400'
  },
  {
    id: 'SENTIMENT_ANALYSIS',
    title: 'Sentiment Analysis Application',
    description: 'Harness AI to analyze customer feedback and gauage product reception.',
    icon: <MessageSquare className="w-8 h-8 text-rose-600" />,
    color: 'border-rose-200 hover:border-rose-400'
  },
  {
    id: 'RELEASE_REPORTING',
    title: 'Jira Release Reporting',
    description: 'Generate comprehensive release reports from Jira with AI-powered insights.',
    icon: <Briefcase className="w-8 h-8 text-orange-600" />,
    color: 'border-orange-200 hover:border-orange-400'
  }
];

export const COMPLIANCE_OPTIONS = [
  { id: 'gdpr', name: 'GDPR', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'accessibility', name: 'Accessibility (WCAG)', icon: <Scale className="w-4 h-4" /> },
  { id: 'security', name: 'Security (SOC2)', icon: <Lock className="w-4 h-4" /> },
  { id: 'availability', name: 'High Availability', icon: <Info className="w-4 h-4" /> },
];
