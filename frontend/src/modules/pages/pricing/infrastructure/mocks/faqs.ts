import type { Faq } from '../../domain/models';

export const faqs: Faq[] = [
  {
    id: '1',
    question: 'Can I change my plan later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings. When upgrading, you\'ll be charged the prorated difference. When downgrading, your new rate takes effect at the next billing cycle.',
  },
  {
    id: '2',
    question: 'Do you offer a free trial?',
    answer: 'Yes, we offer a 14-day free trial on all paid plans. No credit card is required to start your trial. You\'ll have full access to all features during the trial period.',
  },
  {
    id: '3',
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee on all our paid plans. If you\'re not satisfied, contact our support team within 30 days of your purchase for a full refund.',
  },
  {
    id: '4',
    question: 'Do you offer discounts for non-profits or education?',
    answer: 'Yes, we offer a 50% discount for registered non-profit organizations and educational institutions. Please contact our sales team with proof of status to receive your discount code.',
  },
  {
    id: '5',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual Enterprise plans. All payments are processed securely through Stripe.',
  },
  {
    id: '6',
    question: 'Can I cancel my subscription at any time?',
    answer: 'Yes, you can cancel your subscription at any time with no cancellation fees. Your access will continue until the end of your current billing period.',
  },
  {
    id: '7',
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains accessible for 30 days after cancellation, giving you time to export anything you need. After that period, data is permanently deleted in accordance with our privacy policy.',
  },
];
